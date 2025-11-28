'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { Eye, MessageSquare } from 'lucide-react';
import Toast from './Toast';

import Lightbox from '@/components/Lightbox';

export default function DashboardReviews({ reviews }) {
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    // Local state to update UI immediately after reply
    const [localReviews, setLocalReviews] = useState(reviews.filter(r => !r.is_deleted));

    if (!localReviews || localReviews.length === 0) {
        return <p className="text-slate-600">You haven't written any reviews yet.</p>;
    }

    const handleReplySubmit = async (reviewId) => {
        if (!replyText.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/reviews/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId, replyText }),
            });

            if (!res.ok) throw new Error('Failed to submit reply');

            // Update local state
            setLocalReviews(prev => prev.map(r =>
                r._id === reviewId
                    ? { ...r, owner_reply: { text: replyText, createdAt: new Date() } }
                    : r
            ));

            setToast({ message: 'Reply submitted successfully', type: 'success' });
            setReplyingTo(null);
            setReplyText('');
        } catch (error) {
            console.error(error);
            setToast({ message: 'Failed to submit reply', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {lightboxOpen && (
                <Lightbox
                    images={lightboxImages}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxOpen(false)}
                />
            )}

            {localReviews.map(review => (
                <div key={review._id} className="p-4 border rounded-lg bg-white relative">
                    <div className="flex justify-between items-start mb-2">
                        <Link href={`/business/${review.business_id?._id}`} className="font-bold text-gray-900 hover:underline">
                            {review.business_id?.name || 'Unknown Business'}
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="bg-slate-200 text-slate-900 px-2 py-1 rounded text-xs font-bold border border-slate-300">
                                {review.overall_rating.toFixed(1)}/5
                            </div>
                            <Link href={`/business/${review.business_id?._id}`}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <p className="text-sm text-gray-900 mb-2 line-clamp-2">{review.text_content}</p>

                    {/* Display Uploaded Images */}
                    {review.media && review.media.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {review.media.map((url, index) => (
                                <img
                                    key={index}
                                    src={url}
                                    alt={`Review image ${index + 1}`}
                                    className="h-20 w-20 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => openLightbox(review.media, index)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Owner Reply Section */}
                    {review.owner_reply && review.owner_reply.text ? (
                        <div className="mt-3 bg-slate-50 p-3 rounded border border-slate-200 text-sm">
                            <div className="font-bold text-slate-700 mb-1">Your Reply:</div>
                            <p className="text-slate-600">{review.owner_reply.text}</p>
                        </div>
                    ) : (
                        <div className="mt-2">
                            {replyingTo === review._id ? (
                                <div className="mt-2 space-y-2">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="w-full p-2 border rounded text-sm"
                                        placeholder="Write your reply..."
                                        rows="3"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleReplySubmit(review._id)}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Sending...' : 'Send Reply'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setReplyingTo(null)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={() => setReplyingTo(review._id)}
                                >
                                    <MessageSquare className="w-3 h-3 mr-1" /> Reply
                                </Button>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-gray-600 mt-2">
                        <span className="text-slate-700 font-medium">{new Date(review.createdAt).toLocaleDateString()}</span>
                        {review.is_edited && <span className="italic">(edited)</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}
