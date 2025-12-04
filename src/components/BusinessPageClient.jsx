'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui';
import ShareButton from '@/components/ShareButton';
import VerifiedBadge from '@/components/VerifiedBadge';
import BusinessGallery from '@/components/BusinessGallery';
import BusinessContent from '@/components/BusinessContent';

export default function BusinessPageClient({ initialBusiness, initialReviews, initialTotalReviewCount, isUnclaimed, hasPendingClaim, isSubmitter }) {
    const [business, setBusiness] = useState(initialBusiness);
    const [reviews, setReviews] = useState(initialReviews);
    const [totalReviewCount, setTotalReviewCount] = useState(initialTotalReviewCount);

    const handleReviewSubmit = (newReview) => {
        // Update reviews list
        setReviews(prev => [newReview, ...prev]);
        setTotalReviewCount(prev => prev + 1);

        // Update business rating
        setBusiness(prev => {
            const newCount = (prev.review_count || 0) + 1;
            // Calculate new average
            // (Old Avg * Old Count + New Rating) / New Count
            // Note: This is an approximation if we don't have the exact previous sum, but good enough for client-side optimistic update.
            // Better: Use the returned business object if the API returns it, but for now we calculate.
            // Actually, the review API might return the updated business stats? 
            // Usually it's safer to just re-fetch or approximate. 
            // Let's approximate for immediate feedback.
            const currentTotalScore = (prev.aggregate_rating || 0) * (prev.review_count || 0);
            const newRating = (currentTotalScore + newReview.overall_rating) / newCount;

            return {
                ...prev,
                review_count: newCount,
                aggregate_rating: newRating
            };
        });
    };

    const handleReviewUpdate = (updatedReview) => {
        setReviews(prev => prev.map(r => r._id === updatedReview._id ? updatedReview : r));
    };

    const handleReviewDelete = (reviewId) => {
        setReviews(prev => prev.filter(r => r._id !== reviewId));
        setTotalReviewCount(prev => Math.max(0, prev - 1));
        // Note: Aggregates are updated on server, client state is optimistic/approximate until reload
    };

    // Helper to render stars
    const renderStars = (rating) => {
        return (
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => {
                    const isFull = rating >= star;
                    const isHalf = rating >= star - 0.5 && rating < star;

                    return (
                        <div key={star} className="relative">
                            <Star
                                className={`w-4 h-4 ${isFull ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            />
                            {isHalf && (
                                <div className="absolute top-0 left-0 overflow-hidden w-1/2">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-slate-50 pb-12">
            {business.status === 'pending' && (
                <div className="bg-yellow-500 text-white text-center py-3 px-4 font-bold sticky top-16 z-30 shadow-md">
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-xl">⚠️</span>
                        <span>
                            {isSubmitter
                                ? "Your submission is pending approval. You can add reviews while you wait."
                                : "This business is pending approval and is not visible to the public yet."}
                        </span>
                    </div>
                </div>
            )}

            {/* Owner Upgrade Banner */}
            {isSubmitter && business.subscription_tier !== 'pro' && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-3 px-4 font-bold sticky top-16 z-20 shadow-md">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🚀</span>
                            <span>Unlock premium features like custom buttons, verified badge, and analytics!</span>
                        </div>
                        <Link href={`/checkout?plan=pro&businessId=${business._id}`}>
                            <Button size="sm" variant="secondary" className="bg-white text-indigo-600 hover:bg-slate-100 border-0">
                                Upgrade to Pro
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

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
                                {isUnclaimed && (
                                    <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                        Unclaimed
                                    </span>
                                )}
                                {hasPendingClaim && (
                                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                        Claim Pending
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                                {business.name}
                                {business.subscription_tier === 'pro' && (
                                    <VerifiedBadge className="w-8 h-8" variant="gold" tooltip="Verified by business owner" />
                                )}
                            </h1>

                            {/* Address and Rating - Separated */}
                            <div className="flex flex-col gap-2 text-slate-300 text-sm mt-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    <span>{business.address}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {renderStars(business.aggregate_rating || 0)}
                                    <span className="text-white font-bold ml-1">{business.aggregate_rating?.toFixed(1) || 'New'}</span>
                                    <span className="text-slate-400">({totalReviewCount} reviews)</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <ShareButton
                                title={business.name}
                                text={`Check out ${business.name} on ShweReview!`}
                                className="bg-white text-slate-900 hover:bg-slate-100"
                            />
                            {isUnclaimed && !hasPendingClaim && (
                                <Link href={`/business/${business._id}/claim`}>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                        Claim this Business
                                    </Button>
                                </Link>
                            )}
                            {hasPendingClaim && (
                                <Button
                                    disabled
                                    className="bg-gray-400 text-white cursor-not-allowed"
                                    title="Your claim is pending review by admin"
                                >
                                    Pending Claim
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Gallery */}
            <BusinessGallery images={business.images} businessName={business.name} />

            {/* Content */}
            <BusinessContent
                business={business}
                reviews={reviews}
                totalReviewCount={totalReviewCount}
                onReviewSubmit={handleReviewSubmit}
                onReviewUpdate={handleReviewUpdate}
                onReviewDelete={handleReviewDelete}
            />
        </main>
    );
}
