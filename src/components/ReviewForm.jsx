'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Card, Input } from './ui';
import { Star } from 'lucide-react';
import Link from 'next/link';

const CATEGORY_METRICS = {
    restaurant: [
        { key: 'food_quality', label: 'Food Quality' },
        { key: 'ambiance', label: 'Ambiance' },
        { key: 'service', label: 'Service' },
        { key: 'value', label: 'Value' },
    ],
    retail: [
        { key: 'inventory', label: 'Inventory Selection' },
        { key: 'organization', label: 'Store Organization' },
        { key: 'checkout_speed', label: 'Checkout Speed' },
    ],
    logistics: [
        { key: 'timeliness', label: 'Timeliness' },
        { key: 'handling', label: 'Item Handling' },
        { key: 'last_mile', label: 'Last Mile Experience' },
    ],
};

import Toast from './Toast';

export default function ReviewForm({ businessId, category, onReviewSubmitted, initialData = null }) {
    const { data: session } = useSession();
    const [ratings, setRatings] = useState(initialData?.micro_ratings || {});
    const [text, setText] = useState(initialData?.text_content || '');
    const [isAnonymous, setIsAnonymous] = useState(initialData?.is_anonymous || false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const metrics = CATEGORY_METRICS[category] || [];

    const handleRatingChange = (key, value) => {
        setRatings(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!session) return;

        setIsSubmitting(true);

        // Validate that all metrics are rated
        const allRated = metrics.every(m => ratings[m.key]);
        if (!allRated) {
            setToast({ message: 'Please rate all categories', type: 'error' });
            setIsSubmitting(false);
            return;
        }

        try {
            const method = initialData ? 'PUT' : 'POST';
            const body = {
                userId: session.user.id,
                textContent: text,
                microRatings: ratings,
                isAnonymous,
            };

            if (initialData) {
                body.reviewId = initialData._id;
            } else {
                body.businessId = businessId;
                body.categorySnapshot = category;
            }

            const res = await fetch('/api/reviews', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to submit review');

            if (onReviewSubmitted) {
                const enhancedReview = {
                    ...data.review,
                    user_id: {
                        _id: session.user.id,
                        name: session.user.name,
                    }
                };
                onReviewSubmitted(enhancedReview);
            }

            if (!initialData) {
                // Reset form only if creating new
                setRatings({});
                setText('');
                setIsAnonymous(false);
            }

            setToast({ message: initialData ? 'Review updated!' : 'Review submitted!', type: 'success' });
        } catch (error) {
            console.error(error);
            setToast({ message: error.message || 'Error submitting review', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!session) {
        return (
            <Card className="p-6 max-w-2xl mx-auto mt-8 text-center">
                <h2 className="text-xl font-bold mb-2">Write a Review</h2>
                <p className="text-gray-600 mb-4">Please login to write a review.</p>
                <Link href="/login">
                    <Button>Login</Button>
                </Link>
            </Card>
        );
    }

    return (
        <Card className="p-6 max-w-2xl mx-auto mt-8 relative">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <h2 className="text-2xl font-bold mb-4">{initialData ? 'Edit Your Review' : 'Write a Review'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    {metrics.map((metric) => (
                        <div key={metric.key} className="flex items-center justify-between">
                            <label className="font-medium text-gray-700">{metric.label}</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleRatingChange(metric.key, star)}
                                        className={`p-1 transition-colors ${(ratings[metric.key] || 0) >= star ? 'text-yellow-400' : 'text-gray-300'
                                            }`}
                                    >
                                        <Star className="w-6 h-6 fill-current" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div>
                    <label className="block font-medium text-gray-700 mb-2">Your Experience</label>
                    <textarea
                        className="w-full min-h-[100px] rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                        placeholder="Tell us more about your experience..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        required
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="anonymous"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="anonymous" className="text-sm text-gray-700">
                        Post anonymously
                    </label>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Submitting...' : (initialData ? 'Update Review' : 'Submit Review')}
                </Button>
            </form>
        </Card>
    );
}
