'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { TrendingUp, CheckCircle, AlertCircle, Calendar, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdManager({ business }) {
    const router = useRouter();
    const [duration, setDuration] = useState(7);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const isPromoted = business.promoted_until && new Date(business.promoted_until) > new Date();
    const promotedUntil = isPromoted ? new Date(business.promoted_until).toLocaleDateString() : null;

    const pricing = {
        7: 5,
        30: 15
    };

    const handlePromote = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const res = await fetch('/api/ads/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId: business._id,
                    durationDays: duration,
                    amount: pricing[duration]
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create promotion');
            }

            setMessage(data.message);
            router.refresh(); // Refresh to show updated status
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Promote Your Business</h3>
            </div>

            {isPromoted ? (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-md flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                        <span className="font-bold">Active Promotion</span>
                        <div className="text-sm">Expires on {promotedUntil}</div>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-slate-600 mb-4">
                    Boost your visibility! Promoted businesses appear at the top of search results and on the homepage.
                </p>
            )}

            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setDuration(7)}
                        className={`p-3 rounded-lg border text-left transition-all ${duration === 7
                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                            : 'border-slate-200 hover:border-indigo-300 bg-white'
                            }`}
                    >
                        <div className="font-bold text-slate-900">7 Days</div>
                        <div className="text-indigo-600 font-medium">$5.00</div>
                    </button>
                    <button
                        onClick={() => setDuration(30)}
                        className={`p-3 rounded-lg border text-left transition-all ${duration === 30
                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                            : 'border-slate-200 hover:border-indigo-300 bg-white'
                            }`}
                    >
                        <div className="font-bold text-slate-900">30 Days</div>
                        <div className="text-indigo-600 font-medium">$15.00</div>
                        <div className="text-xs text-green-600 font-bold mt-1">Save 15%</div>
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {message && (
                    <div className="p-3 bg-green-50 text-green-600 rounded-md text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {message}
                    </div>
                )}

                <Button
                    onClick={handlePromote}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {loading ? 'Processing...' : (
                        <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Pay ${pricing[duration]} & Promote
                        </>
                    )}
                </Button>
                <p className="text-xs text-center text-slate-500 mt-2">
                    Secure payment via Mock Gateway
                </p>
            </div>
        </div>
    );
}
