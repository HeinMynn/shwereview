'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { Eye } from 'lucide-react';

export default function DashboardReviews({ reviews }) {
    if (!reviews || reviews.length === 0) {
        return <p className="text-slate-600">You haven't written any reviews yet.</p>;
    }

    return (
        <div className="space-y-4">
            {reviews.map(review => (
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
                    <div className="flex justify-between items-center text-xs text-gray-600">
                        <span className="text-slate-700 font-medium">{new Date(review.createdAt).toLocaleDateString()}</span>
                        {review.is_edited && <span className="italic">(edited)</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}
