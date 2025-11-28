'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Button } from '@/components/ui';
import ReviewForm from '@/components/ReviewForm';
import ReportModal from '@/components/ReportModal';
import Toast from '@/components/Toast';
import { Pencil, Star, MapPin, Share2, Flag, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

import Lightbox from '@/components/Lightbox';

export default function BusinessContent({ business, initialReviews }) {
    const { data: session } = useSession();
    const [reviews, setReviews] = useState(initialReviews);
    const [isEditing, setIsEditing] = useState(false);
    const [reportingReviewId, setReportingReviewId] = useState(null);
    const [replyingReviewId, setReplyingReviewId] = useState(null);

    const [toast, setToast] = useState(null);

    // Lightbox State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImages, setLightboxImages] = useState([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const openLightbox = (images, index) => {
        setLightboxImages(images);
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    // Sync state with props
    useEffect(() => {
        setReviews(initialReviews);
    }, [initialReviews]);

    const userReview = session ? reviews.find(r => (r.user_id?._id === session.user.id || r.user_id === session.user.id) && !r.is_deleted) : null;
    const isOwner = session?.user?.id === business.owner_id;

    const handleReviewSubmitted = (newReview) => {
        if (isEditing) {
            setReviews(prev => prev.map(r => r._id === newReview._id ? newReview : r));
            setIsEditing(false);
            setToast({ message: 'Review updated successfully', type: 'success' });
        } else {
            setReviews(prev => [newReview, ...prev]);
            setToast({ message: 'Review submitted successfully', type: 'success' });
        }
    };

    const toggleHideReview = async (reviewId, currentHiddenStatus) => {
        try {
            const res = await fetch('/api/admin/reviews/hide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId, isHidden: !currentHiddenStatus }),
            });

            if (!res.ok) throw new Error('Failed to update');

            const data = await res.json();
            setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, is_hidden: data.review.is_hidden } : r));
            setToast({ message: `Review ${data.review.is_hidden ? 'hidden' : 'visible'}`, type: 'success' });
        } catch (error) {
            console.error('Failed to toggle review visibility:', error);
            setToast({ message: 'Failed to update review visibility', type: 'error' });
        }
    };

    const isAdmin = session?.user?.role === 'Super Admin';
    const visibleReviews = reviews.filter(r => (!r.is_hidden && !r.is_deleted) || isAdmin).sort((a, b) => {
        const aIsActive = !a.is_hidden && !a.is_deleted;
        const bIsActive = !b.is_hidden && !b.is_deleted;

        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;

        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {lightboxOpen && (
                <Lightbox
                    images={lightboxImages}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxOpen(false)}
                />
            )}

            {reportingReviewId && (
                <ReportModal
                    reviewId={reportingReviewId}
                    onClose={() => setReportingReviewId(null)}
                />
            )}

            {/* Left Column: Reviews List */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-lg border border-slate-200">
                    <h2 className="text-xl font-bold mb-4">About</h2>
                    <p className="text-gray-700 mb-6">{business.description}</p>

                    {/* Micro Metrics Display */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {business.micro_metrics_aggregates && Object.entries(business.micro_metrics_aggregates).map(([key, value]) => (
                            <div key={key} className="bg-slate-50 p-3 rounded border border-slate-100">
                                <div className="text-xs text-gray-600 uppercase font-bold mb-1">
                                    {key.replace('_', ' ')}
                                </div>
                                <div className="text-lg font-bold text-slate-900">
                                    {typeof value === 'number' ? value.toFixed(1) : value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900">Reviews ({visibleReviews.length})</h2>
                {visibleReviews.map((review) => (
                    <Card key={review._id} className={`p-6 ${(review.is_hidden || review.is_deleted) ? 'opacity-50 bg-gray-50 border-dashed' : ''}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                    {review.is_anonymous ? 'A' : (review.user_id?.name?.[0] || 'U')}
                                </div>
                                <div>
                                    <div className="font-bold text-sm">
                                        {review.is_anonymous ? (
                                            isAdmin ? (
                                                <Link href={`/admin/users/${review.user_id?._id}`} className="text-red-600 hover:underline">
                                                    {review.user_id?.name} (Anonymous)
                                                </Link>
                                            ) : 'Anonymous'
                                        ) : (
                                            isAdmin ? (
                                                <Link href={`/admin/users/${review.user_id?._id}`} className="hover:underline text-blue-600">
                                                    {review.user_id?.name || 'Unknown User'}
                                                </Link>
                                            ) : (
                                                review.user_id?.name || 'Unknown User'
                                            )
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                        {review.is_edited && <span className="italic ml-1">(edited)</span>}
                                        {review.is_hidden && <span className="ml-2 text-red-600 font-bold uppercase text-[10px] border border-red-200 px-1 rounded">Hidden</span>}
                                        {review.is_deleted && <span className="ml-2 text-orange-600 font-bold uppercase text-[10px] border border-orange-200 px-1 rounded">Deleted by User</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="bg-slate-100 px-2 py-1 rounded text-sm font-bold">
                                    {review.overall_rating.toFixed(1)} / 5
                                </div>
                                {isAdmin && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-6 px-2 text-gray-600 hover:text-red-600"
                                        onClick={() => toggleHideReview(review._id, review.is_hidden)}
                                    >
                                        {review.is_hidden ? 'Unhide' : 'Hide'}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <p className="text-gray-800 mb-4">{review.text_content}</p>

                        {/* Display Uploaded Images */}
                        {review.media && review.media.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {review.media.map((url, index) => (
                                    <img
                                        key={index}
                                        src={url}
                                        alt={`Review image ${index + 1}`}
                                        className="h-24 w-24 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => openLightbox(review.media, index)}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 mb-4">
                            {review.micro_ratings && Object.entries(review.micro_ratings).map(([key, value]) => (
                                <span key={key} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">
                                    {key.replace('_', ' ')}: <b>{value}</b>
                                </span>
                            ))}
                        </div>

                        {/* Owner Reply Display & Action */}
                        {review.owner_reply && review.owner_reply.text ? (
                            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-indigo-500 mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="font-bold text-slate-900 text-sm">Response from the owner</div>
                                    <span className="text-xs text-slate-500">{new Date(review.owner_reply.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-slate-700 text-sm">{review.owner_reply.text}</p>
                            </div>
                        ) : isOwner && (
                            <div className="mb-4">
                                {replyingReviewId === review._id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            id={`reply-text-${review._id}`}
                                            className="w-full p-2 border rounded text-sm"
                                            placeholder="Write your reply..."
                                            rows="3"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={async () => {
                                                    const text = document.getElementById(`reply-text-${review._id}`).value;
                                                    if (!text) return;

                                                    try {
                                                        const res = await fetch('/api/reviews/reply', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ reviewId: review._id, replyText: text }),
                                                        });

                                                        if (res.ok) {
                                                            // Optimistic update
                                                            setReviews(prev => prev.map(r =>
                                                                r._id === review._id
                                                                    ? { ...r, owner_reply: { text, createdAt: new Date() } }
                                                                    : r
                                                            ));
                                                            setReplyingReviewId(null);
                                                            setToast({ message: 'Reply sent successfully', type: 'success' });
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                        setToast({ message: 'Failed to reply', type: 'error' });
                                                    }
                                                }}
                                            >
                                                Send Reply
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setReplyingReviewId(null)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setReplyingReviewId(review._id)}
                                    >
                                        Reply to Review
                                    </Button>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                            {session && session.user.id !== review.user_id?._id && (
                                <button
                                    onClick={() => setReportingReviewId(review._id)}
                                    className="text-sm text-slate-600 hover:text-red-600 font-medium flex items-center gap-1"
                                >
                                    <Flag className="w-3 h-3" /> Report
                                </button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Right Column: Write/Edit Review */}
            <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-6">
                    {/* Business Info Card */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-4">Business Info</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-slate-500 mt-1" />
                                <p className="text-slate-700">{business.address}</p>
                            </div>
                            <Button variant="outline" className="w-full">
                                <Share2 className="w-4 h-4 mr-2" /> Share
                            </Button>
                        </div>
                    </div>

                    {isOwner ? (
                        <Card className="p-6 bg-slate-50 border-slate-200">
                            <h3 className="font-bold text-slate-900 mb-2">Business Owner</h3>
                            <p className="text-sm text-gray-600">You cannot review your own business.</p>
                        </Card>
                    ) : userReview && !isEditing ? (
                        <Card className="p-6 bg-slate-50 border-slate-200">
                            <h3 className="font-bold text-slate-900 mb-2">You reviewed this business</h3>
                            <div className="mb-4 text-sm text-gray-600">
                                You gave it <b>{userReview.overall_rating.toFixed(1)}/5</b> stars.
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1">
                                    <Pencil className="w-4 h-4 mr-2" /> Edit Review
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                    onClick={async () => {
                                        if (!confirm('Are you sure you want to delete your review?')) return;
                                        try {
                                            const res = await fetch(`/api/reviews?id=${userReview._id}`, {
                                                method: 'DELETE',
                                            });
                                            if (res.ok) {
                                                setReviews(prev => prev.filter(r => r._id !== userReview._id));
                                                setToast({ message: 'Review deleted', type: 'success' });
                                            } else {
                                                throw new Error('Failed to delete');
                                            }
                                        } catch (error) {
                                            console.error(error);
                                            setToast({ message: 'Error deleting review', type: 'error' });
                                        }
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <ReviewForm
                            businessId={business._id}
                            category={business.category}
                            onReviewSubmitted={handleReviewSubmitted}
                            initialData={isEditing ? userReview : null}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
