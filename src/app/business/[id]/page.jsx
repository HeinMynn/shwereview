import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import { Business, Review } from '@/lib/models';
import BusinessContent from '@/components/BusinessContent';
import { Button, Card } from '@/components/ui';
import { Star, MapPin, CheckCircle, Share2 } from 'lucide-react';
import Link from 'next/link';

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

    const reviews = await Review.find({ business_id: id })
        .populate('user_id', 'name avatar badges')
        .sort({ createdAt: -1 })
        .lean();

    return {
        business: JSON.parse(JSON.stringify(business)),
        reviews: JSON.parse(JSON.stringify(reviews))
    };
}

export default async function BusinessProfile({ params }) {
    const { id } = await params;
    const data = await getBusiness(id);

    if (!data) return notFound();

    const { business, reviews } = data;
    const isUnclaimed = !business.owner_id;

    return (
        <main className="min-h-screen bg-slate-50 pb-12">
            {/* Hero Section */}
            <div className="relative h-[300px] md:h-[400px] bg-slate-900">
                <img
                    src={business.images?.[0] || 'https://placehold.co/1200x400/gray/white?text=No+Image'}
                    alt={business.name}
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-yellow-400 text-slate-900 text-xs font-bold px-2 py-1 rounded uppercase">
                                    {business.category}
                                </span>
                                {business.is_verified && (
                                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Verified
                                    </span>
                                )}
                                {isUnclaimed && (
                                    <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                        Unclaimed
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{business.name}</h1>
                            <div className="flex items-center gap-4 text-slate-300 text-sm">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" /> {business.address}
                                </div>
                                <div>•</div>
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="text-white font-bold">{business.aggregate_rating?.toFixed(1) || 'New'}</span>
                                    <span>({reviews.length} reviews)</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button className="bg-white text-slate-900 hover:bg-slate-100">
                                <Share2 className="w-4 h-4 mr-2" /> Share
                            </Button>
                            {isUnclaimed && (
                                <Link href={`/business/${id}/claim`}>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                        Claim this Business
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <BusinessContent business={business} initialReviews={reviews} />
        </main>
    );
}
