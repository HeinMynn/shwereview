'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { X, AlertTriangle } from 'lucide-react';
import Toast from './Toast';

export default function ReportModal({ reviewId, onClose }) {
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const reasons = [
        { value: 'spam', label: 'Spam or advertising' },
        { value: 'harassment', label: 'Harassment or hate speech' },
        { value: 'inappropriate', label: 'Inappropriate content' },
        { value: 'fake', label: 'Fake review' },
        { value: 'other', label: 'Other' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) return;

        setLoading(true);
        try {
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId, reason, customReason }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    setToast({ message: 'You have already reported this review.', type: 'error' });
                    setTimeout(onClose, 2000);
                    return;
                }
                throw new Error(data.error || 'Failed to submit report');
            }

            setToast({ message: 'Report submitted successfully.', type: 'success' });
            setTimeout(onClose, 2000);
        } catch (error) {
            console.error(error);
            setToast({ message: 'Failed to submit report. Please try again.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Report Review
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">
                            Why are you reporting this review?
                        </label>
                        <div className="space-y-2">
                            {reasons.map((r) => (
                                <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={r.value}
                                        checked={reason === r.value}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-gray-800">{r.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {reason === 'other' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-800 mb-2">
                                Please provide more details
                            </label>
                            <textarea
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows="3"
                                placeholder="Describe the issue..."
                                required
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !reason} className="bg-red-600 hover:bg-red-700 text-white">
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
