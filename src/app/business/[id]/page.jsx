import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Business, Review, BusinessClaim } from '@/lib/models';
import BusinessPageClient from '@/components/BusinessPageClient';

import { Button, Card } from '@/components/ui';
import { Star, MapPin, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import VerifiedBadge from '@/components/VerifiedBadge';
import ShareButton from '@/components/ShareButton';


export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


async function getBusiness(id) {
    await dbConnect();
    const business = await Business.findById(id).lean();
    if (!business) return null;

    // Check visibility
    if (business.status !== 'approved') {
        const session = await getServerSession(authOptions);
        const isOwner = session?.user?.id === business.submitted_by?.toString() || session?.user?.id === business.owner_id?.toString();
        const isAdmin = session?.user?.role === 'Super Admin';

        if (!isOwner && !isAdmin) {
            return null; // Treat as not found for unauthorized users
        }
    }

    const reviews = await Review.find({ business_id: id, is_deleted: false })
        .populate('user_id', 'name avatar badges phone_verified')
        .sort({ createdAt: -1 })
        .limit(20) // Limit initial reviews to improve performance
        .lean();

    const totalReviewCount = await Review.countDocuments({ business_id: id, is_hidden: false, is_deleted: false });

    // Fetch similar businesses
    // Fetch similar businesses with prioritization
    const similarBusinesses = await Business.aggregate([
        {
            $match: {
                status: 'approved',
                _id: { $ne: new mongoose.Types.ObjectId(id) },
                $or: [
                    { category: business.category },
                    { tags: { $in: business.tags || [] } }
                ]
            }
        },
        {
            $addFields: {
                score: {
                    $add: [
                        { $cond: [{ $eq: ["$subcategory", business.subcategory] }, 100, 0] },
                        { $cond: [{ $eq: ["$category", business.category] }, 50, 0] },
                        {
                            $multiply: [
                                {
                                    $size: {
                                        $setIntersection: [{ $ifNull: ["$tags", []] }, business.tags || []]
                                    }
                                },
                                10
                            ]
                        }
                    ]
                }
            }
        },
        { $sort: { score: -1, aggregate_rating: -1 } },
        { $limit: 4 },
        {
            $project: {
                name: 1,
                category: 1,
                address: 1,
                images: 1,
                aggregate_rating: 1,
                review_count: 1
            }
        }
    ]);

    return {
        business: JSON.parse(JSON.stringify(business)),
        reviews: JSON.parse(JSON.stringify(reviews)),
        totalReviewCount,
        similarBusinesses: JSON.parse(JSON.stringify(similarBusinesses))
    };
}


export default async function BusinessProfile({ params }) {
    const { id } = await params;
    const data = await getBusiness(id);

    if (!data) return notFound();

    const { business, reviews, similarBusinesses } = data;
    const session = await getServerSession(authOptions);

    const isUnclaimed = !business.owner_id;

    // Check for pending claim directly from the Claims collection
    let hasPendingClaim = false;
    let pendingClaimDoc = null;
    if (session?.user?.id) {
        const claim = await BusinessClaim.findOne({
            business_id: id,
            claimant_id: session.user.id,
            status: 'pending'
        });
        if (claim) {
            hasPendingClaim = true;
            pendingClaimDoc = claim.toObject ? claim.toObject() : claim;
        }
    }

    const isPendingApproval = business.status === 'pending';
    const isSubmitter = session?.user?.id && business.submitted_by?.toString() === session.user.id;
    const isOwner = session?.user?.id && business.owner_id?.toString() === session.user.id;


    return (
        <BusinessPageClient
            initialBusiness={business}
            initialReviews={reviews}
            initialTotalReviewCount={data.totalReviewCount}
            isUnclaimed={isUnclaimed}
            userClaim={hasPendingClaim ? { status: 'pending', verification_status: pendingClaimDoc?.verification_status } : null}
            isSubmitter={isSubmitter}
            isOwner={isOwner}
            similarBusinesses={similarBusinesses}
        />
    );
}
