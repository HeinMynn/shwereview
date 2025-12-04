import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import { Business, Review } from '@/lib/models';
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

    return {
        business: JSON.parse(JSON.stringify(business)),
        reviews: JSON.parse(JSON.stringify(reviews)),
        totalReviewCount
    };
}


export default async function BusinessProfile({ params }) {
    const { id } = await params;
    const data = await getBusiness(id);

    if (!data) return notFound();

    const { business, reviews } = data;
    const session = await getServerSession(authOptions);

    const isUnclaimed = !business.owner_id;
    const hasPendingClaim = business.claim_status === 'pending' && business.claimant_id?.toString() === session?.user?.id;
    const isPendingApproval = business.status === 'pending';
    const isSubmitter = session?.user?.id && business.submitted_by?.toString() === session.user.id;

    return (
        <BusinessPageClient
            initialBusiness={business}
            initialReviews={reviews}
            initialTotalReviewCount={data.totalReviewCount}
            isUnclaimed={isUnclaimed}
            hasPendingClaim={hasPendingClaim}
            isSubmitter={isSubmitter}
        />
    );
}
