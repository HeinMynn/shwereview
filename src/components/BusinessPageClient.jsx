'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Star, XCircle, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui';
import ShareButton from '@/components/ShareButton';
import VerifiedBadge from '@/components/VerifiedBadge';
import BusinessGallery from '@/components/BusinessGallery';
import BusinessContent from '@/components/BusinessContent';
import Toast from '@/components/Toast';

export default function BusinessPageClient({ initialBusiness, initialReviews, initialTotalReviewCount, isUnclaimed, userClaim, isSubmitter, isOwner, similarBusinesses }) {
    const [business, setBusiness] = useState(initialBusiness);
    const [reviews, setReviews] = useState(initialReviews);
    const [totalReviewCount, setTotalReviewCount] = useState(initialTotalReviewCount);
    const [toast, setToast] = useState(null);
    const [mounted, setMounted] = useState(false);

    // Appeal State
    const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
    const [appealMessage, setAppealMessage] = useState('');
    const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

    const [pricing, setPricing] = useState({ pro_monthly: 29 }); // Fallback

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const res = await fetch('/api/admin/config');
                if (res.ok) {
                    const data = await res.json();
                    setPricing(data);
                }
            } catch (err) {
                console.error("Failed to fetch pricing", err);
            }
        };
        fetchPricing();
    }, []);

    useEffect(() => {
        setMounted(true);
        // Track View
        trackEvent('view');
    }, []);

    const trackEvent = async (eventType) => {
        try {
            await fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId: business._id, eventType }),
            });
        } catch (err) {
            // Fail silently for analytics
            console.error('Tracking failed', err);
        }
    };

    const handleReviewSubmit = (newReview) => {
        setReviews(prev => [newReview, ...prev]);
        setTotalReviewCount(prev => prev + 1);
        setBusiness(prev => {
            const newCount = (prev.review_count || 0) + 1;
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
    };

    const handleAppealSubmit = async (e) => {
        e.preventDefault();
        setIsSubmittingAppeal(true);
        try {
            const res = await fetch('/api/business/appeal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId: business._id, appealMessage }),
            });

            if (!res.ok) throw new Error('Failed to submit appeal');

            setToast({ message: 'Appeal submitted successfully. Business is now pending review.', type: 'success' });
            setIsAppealModalOpen(false);
            // Reload page to reflect status change
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error(error);
            setToast({ message: 'Failed to submit appeal', type: 'error' });
        } finally {
            setIsSubmittingAppeal(false);
        }
    };

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

    if (!mounted) return null;

    return (
        <main className="min-h-screen bg-slate-50 pb-12 relative">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

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

            {business.status === 'rejected' && (isSubmitter || isOwner) && (
                <div className="bg-red-600 text-white text-center py-4 px-4 font-bold sticky top-16 z-30 shadow-md">
                    <div className="flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center gap-2 text-lg">
                            <span className="text-2xl">❌</span>
                            <span>Your submission was rejected.</span>
                        </div>
                        {business.rejection_reason && (
                            <div className="text-sm font-medium bg-white text-red-700 px-3 py-1 rounded mt-1 shadow-sm">
                                <strong>Reason:</strong> {business.rejection_reason}
                            </div>
                        )}
                        <div className="text-xs font-normal mt-1 opacity-90">
                            Please contact support if you believe this is a mistake.
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="mt-2 bg-white text-red-600 hover:bg-red-50 border-0"
                            onClick={() => setIsAppealModalOpen(true)}
                        >
                            Appeal Decision
                        </Button>
                    </div>
                </div>
            )}


            {isOwner && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-3 px-4 font-bold sticky top-16 z-20 shadow-md">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        {business.subscription_tier !== 'pro' ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🚀</span>
                                <span>Unlock premium features like custom buttons, verified badge, and analytics!</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-xl">✨</span>
                                <span>You are viewing your business as a <strong>Pro</strong> owner.</span>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Link href={`/business/${business._id}/dashboard`}>
                                <Button size="sm" className="bg-white text-indigo-900 hover:bg-indigo-50 border-0 font-bold gap-2">
                                    <LayoutDashboard className="w-4 h-4" />
                                    Manage Dashboard
                                </Button>
                            </Link>
                            {business.subscription_tier !== 'pro' && (
                                <Link href={`/checkout?plan=pro&businessId=${business._id}`}>
                                    <Button size="sm" variant="secondary" className="bg-indigo-800 text-white hover:bg-indigo-900 border-0">
                                        Upgrade to Pro (${pricing.pro_monthly}/mo)
                                    </Button>
                                </Link>
                            )}
                        </div>
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
                                {userClaim && (
                                    <span className={`text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 ${userClaim.verification_status === 'pending' ? 'bg-orange-500' : 'bg-green-500'}`}>
                                        {userClaim.verification_status === 'pending' ? 'Verification Incomplete' : 'Claim Pending'}
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
                            <div onClick={() => trackEvent('click_share')}>
                                <ShareButton
                                    title={business.name}
                                    text={`Check out ${business.name} on ShweReview!`}
                                    className="bg-white text-slate-900 hover:bg-slate-100"
                                />
                            </div>
                            {isUnclaimed && !userClaim && (
                                <Link href={`/business/${business._id}/claim`}>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                        Claim this Business
                                    </Button>
                                </Link>
                            )}
                            {userClaim && userClaim.verification_status === 'pending' && (
                                <Link href={`/business/${business._id}/claim`}>
                                    <Button
                                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                                        title="Continue your claim verification"
                                    >
                                        Continue Claim
                                    </Button>
                                </Link>
                            )}
                            {userClaim && userClaim.verification_status === 'verified' && (
                                <Button
                                    disabled
                                    className="bg-gray-400 text-white cursor-not-allowed"
                                    title="Your claim is pending review by admin"
                                >
                                    Claim Pending Approval
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

            {/* You May Also Like Section */}
            {similarBusinesses && similarBusinesses.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 mt-12">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">You May Also Like</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {similarBusinesses.map((biz) => (
                            <Link key={biz._id} href={`/business/${biz._id}`} className="group">
                                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                                    <div className="h-48 overflow-hidden relative bg-slate-100">
                                        <img
                                            src={biz.images?.[0] || 'https://placehold.co/600x400/gray/white?text=No+Image'}
                                            alt={biz.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-slate-700 shadow-sm">
                                            {biz.category}
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                            {biz.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex items-center">
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                <span className="font-bold text-slate-900 ml-1 text-sm">
                                                    {biz.aggregate_rating?.toFixed(1) || 'New'}
                                                </span>
                                            </div>
                                            <span className="text-slate-400 text-sm">•</span>
                                            <span className="text-slate-500 text-sm">{biz.review_count || 0} reviews</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-slate-500 text-sm mt-auto">
                                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            <span className="line-clamp-2">{biz.address}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Appeal Modal */}
            {isAppealModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Appeal Rejection</h3>
                            <button onClick={() => setIsAppealModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAppealSubmit}>
                            <p className="text-sm text-gray-600 mb-4">
                                Please explain why your business should be approved. This message will be sent to the admin for review.
                            </p>
                            <textarea
                                value={appealMessage}
                                onChange={(e) => setAppealMessage(e.target.value)}
                                placeholder="Enter your appeal message..."
                                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                rows={4}
                                required
                            />
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsAppealModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmittingAppeal}>
                                    {isSubmittingAppeal ? 'Submitting...' : 'Submit Appeal'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
