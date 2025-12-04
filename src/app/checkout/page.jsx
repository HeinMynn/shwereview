'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Card, Input } from '@/components/ui';
import { Loader2, CreditCard, Lock } from 'lucide-react';

function CheckoutForm() {
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan');
    const router = useRouter();
    const { data: session } = useSession();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState('');

    // Fetch user's businesses to select which one to upgrade
    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                const res = await fetch('/api/user/businesses'); // We might need to create this or use existing
                // Fallback: use the admin/businesses API but filtered? 
                // Better: Create a specific endpoint or use existing if available.
                // Let's assume we need to fetch businesses owned by the user.
                // For now, let's try to fetch from a new endpoint we'll create or just mock if needed.
                // Actually, we can use /api/businesses?owner_id=... if that exists, or just create a simple one.
                // Let's assume we'll create /api/user/businesses for this.
                const data = await res.json();

                if (res.ok) {
                    setBusinesses(data.businesses || []);

                    // Auto-select business from URL param if available
                    const businessIdFromUrl = searchParams.get('businessId');
                    if (businessIdFromUrl) {
                        const targetBusiness = data.businesses?.find(b => b._id === businessIdFromUrl);
                        if (targetBusiness) {
                            setSelectedBusinessId(targetBusiness._id);
                        } else if (data.businesses?.length > 0) {
                            setSelectedBusinessId(data.businesses[0]._id);
                        }
                    } else if (data.businesses?.length > 0) {
                        setSelectedBusinessId(data.businesses[0]._id);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch businesses", err);
            }
        };

        if (session) {
            fetchBusinesses();
        }
    }, [session]);

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!selectedBusinessId) {
                throw new Error("Please select a business to upgrade.");
            }

            // Simulate API call to process payment
            const res = await fetch('/api/subscription/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId: selectedBusinessId,
                    plan: plan || 'pro',
                    paymentMethod: 'mock_card'
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Payment failed');

            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return <div className="p-8 text-center">Please log in to continue.</div>;
    }

    if (success) {
        return (
            <Card className="max-w-md mx-auto p-8 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
                <p className="text-slate-600 mb-4">Your business has been upgraded to Pro.</p>
                <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
            </Card>
        );
    }

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Checkout - {plan === 'pro' ? 'Pro Plan' : 'Plan'}</h1>

            <Card className="p-6">
                <form onSubmit={handlePayment} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Business</label>
                        {businesses.length > 0 ? (
                            <select
                                value={selectedBusinessId}
                                onChange={(e) => setSelectedBusinessId(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-md"
                            >
                                {businesses.map(b => (
                                    <option key={b._id} value={b._id}>{b.name}</option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-sm text-red-500">No businesses found. Please create one first.</p>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-slate-900">Pro Subscription</span>
                            <span className="font-bold text-slate-900">$20.00</span>
                        </div>
                        <p className="text-xs text-slate-500">Billed monthly</p>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-700">Payment Details (Mock)</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Card number"
                                className="pl-10"
                                defaultValue="4242 4242 4242 4242"
                                disabled
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="MM/YY" defaultValue="12/25" disabled />
                            <Input placeholder="CVC" defaultValue="123" disabled />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading || businesses.length === 0}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                        {loading ? 'Processing...' : 'Pay $20.00'}
                    </Button>
                </form>
            </Card>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <Suspense fallback={<div>Loading...</div>}>
                <CheckoutForm />
            </Suspense>
        </div>
    );
}
