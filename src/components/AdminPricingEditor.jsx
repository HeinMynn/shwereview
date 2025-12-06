'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { Save, Loader2, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import Toast from '@/components/Toast';

export default function AdminPricingEditor() {
    const [pricing, setPricing] = useState({
        pro_monthly: 29,
        promote_7_days: 5,
        promote_30_days: 15
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/admin/config');
            if (res.ok) {
                const data = await res.json();
                setPricing(data);
            }
        } catch (error) {
            console.error('Failed to fetch pricing config', error);
            setToast({ message: 'Failed to load pricing configuration', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPricing(prev => ({
            ...prev,
            [name]: parseFloat(value) // Store as number
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pricing)
            });

            if (!res.ok) throw new Error('Failed to update');

            setToast({ message: 'Pricing configuration updated successfully', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to save changes', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading configuration...</div>;

    return (
        <div className="max-w-2xl">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <Card className="p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                    Pricing Configuration
                </h2>

                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-slate-700 mb-4 border-b pb-2">Subscription Plans</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Pro Plan (Monthly)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                                    <Input
                                        type="number"
                                        name="pro_monthly"
                                        value={pricing.pro_monthly}
                                        onChange={handleChange}
                                        className="pl-7"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Default price for Pro subscription upgrades.</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-700 mb-4 border-b pb-2">Ad Promotions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    7 Days Promotion
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                                    <Input
                                        type="number"
                                        name="promote_7_days"
                                        value={pricing.promote_7_days}
                                        onChange={handleChange}
                                        className="pl-7"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    30 Days Promotion
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                                    <Input
                                        type="number"
                                        name="promote_30_days"
                                        value={pricing.promote_30_days}
                                        onChange={handleChange}
                                        className="pl-7"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
