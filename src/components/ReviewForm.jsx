'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Card, Input } from './ui';
import { Star, Loader2 } from 'lucide-react';
import Link from 'next/link';

const CATEGORY_METRICS = {
    'food-dining': [
        { key: 'taste', label: 'Taste (အရသာ)' },
        { key: 'food_quality', label: 'Food Quality (အစားအသောက် အရည်အသွေး)' },
        { key: 'ambiance', label: 'Ambiance (ဆိုင်အပြင်အဆင်)' },
        { key: 'service', label: 'Service (ဝန်ဆောင်မှု)' },
        { key: 'value', label: 'Value (တန်ဖိုး)' },
    ],
    'shopping': [
        { key: 'quality', label: 'Product Quality (ပစ္စည်းအရည်အသွေး)' },
        { key: 'value', label: 'Value (တန်ဖိုး)' },
        { key: 'variety', label: 'Variety (ပစ္စည်းစုံလင်မှု)' },
        { key: 'service', label: 'Service (ဝန်ဆောင်မှု)' },
    ],
    'services': [
        { key: 'professionalism', label: 'Professionalism (ကျွမ်းကျင်မှု)' },
        { key: 'timeliness', label: 'Timeliness (အချိန်မှန်ကန်မှု)' },
        { key: 'quality', label: 'Service Quality (ဝန်ဆောင်မှုအရည်အသွေး)' },
        { key: 'value', label: 'Value (တန်ဖိုး)' },
        { key: 'communication', label: 'Communication (ဆက်ဆံရေး)' },
    ],
    'education': [
        { key: 'teaching_quality', label: 'Teaching Quality (သင်ကြားမှု အရည်အသွေး)' },
        { key: 'student_support', label: 'Student Support (ကျောင်းသားပံ့ပိုးမှု)' },
        { key: 'facilities', label: 'Facilities (အထောက်အကူပြုပစ္စည်းများ)' },
        { key: 'environment', label: 'Environment (ပတ်ဝန်းကျင်)' },
    ],
    'beauty-wellness': [
        { key: 'cleanliness', label: 'Cleanliness (သန့်ရှင်းမှု)' },
        { key: 'service', label: 'Service (ဝန်ဆောင်မှု)' },
        { key: 'expertise', label: 'Expertise (ကျွမ်းကျင်မှု)' },
        { key: 'ambiance', label: 'Ambiance (ဆိုင်အပြင်အဆင်)' },
        { key: 'value', label: 'Value (တန်ဖိုး)' },
    ],
    'entertainment': [
        { key: 'fun_factor', label: 'Fun Factor (ပျော်ရွှင်ဖွယ်ရာ)' },
        { key: 'facilities', label: 'Facilities (အထောက်အကူပြုပစ္စည်းများ)' },
        { key: 'service', label: 'Service (ဝန်ဆောင်မှု)' },
        { key: 'atmosphere', label: 'Atmosphere (လေထု)' },
        { key: 'value', label: 'Value (တန်ဖိုး)' },
    ],
    'hospitality-travel': [
        { key: 'cleanliness', label: 'Cleanliness (သန့်ရှင်းမှု)' },
        { key: 'comfort', label: 'Comfort (သက်တောင့်သက်သာရှိမှု)' },
        { key: 'location', label: 'Location (တည်နေရာ)' },
        { key: 'service', label: 'Service (ဝန်ဆောင်မှု)' },
        { key: 'value', label: 'Value (တန်ဖိုး)' },
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
    const [uploadedImages, setUploadedImages] = useState(initialData?.media || []);
    const [isUploading, setIsUploading] = useState(false);

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
                media: uploadedImages,
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
                        onChange={(e) => setText(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block font-medium text-gray-700 mb-2">Add Photos (Optional, Max 9)</label>
                    <div className="flex flex-col gap-4">
                        <Input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={isUploading}
                            onChange={async (e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length === 0) return;

                                if (uploadedImages.length + files.length > 9) {
                                    setToast({ message: 'You can only upload a maximum of 9 images', type: 'error' });
                                    return;
                                }

                                setIsUploading(true);

                                try {
                                    const newUrls = [];
                                    for (const file of files) {
                                        const formData = new FormData();
                                        formData.append('file', file);

                                        const res = await fetch('/api/upload/cloudinary', {
                                            method: 'POST',
                                            body: formData,
                                        });
                                        const data = await res.json();

                                        if (!res.ok) throw new Error(data.error || 'Upload failed');
                                        newUrls.push(data.url);
                                    }

                                    setUploadedImages(prev => [...prev, ...newUrls]);
                                    setToast({ message: 'Images uploaded successfully!', type: 'success' });
                                } catch (error) {
                                    console.error(error);
                                    setToast({ message: 'Failed to upload some images', type: 'error' });
                                } finally {
                                    setIsUploading(false);
                                }

                                // Reset input
                                e.target.value = '';
                            }}
                        />
                        {isUploading && (
                            <div className="flex items-center gap-2 text-indigo-600 font-medium mt-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Uploading...</span>
                            </div>
                        )}
                    </div>
                    {uploadedImages.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {uploadedImages.map((url, index) => (
                                <div key={index} className="relative group">
                                    <img src={url} alt={`Uploaded ${index + 1}`} className="w-20 h-20 object-cover rounded border" />
                                    <button
                                        type="button"
                                        onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
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
            </form >
        </Card >
    );
}
