'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import Link from 'next/link';

export default function NewBusinessPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        category: 'restaurant',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!session) return;

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/businesses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to create business');

            alert('Business submitted successfully! It will be reviewed by an admin.');
            router.push('/');
        } catch (error) {
            console.error(error);
            alert('Error submitting business');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
                <Card className="p-6 max-w-md w-full text-center">
                    <h2 className="text-xl font-bold mb-2">Add a Business</h2>
                    <p className="text-gray-600 mb-4">Please login to submit a new business.</p>
                    <Link href="/login">
                        <Button>Login</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Add a New Business</h1>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g., The Gourmet Spot"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                className="w-full min-h-[100px] rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                placeholder="Brief description of the business..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <Input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                                placeholder="e.g., 123 Main St"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 bg-white"
                            >
                                <option value="restaurant">Restaurant</option>
                                <option value="retail">Retail</option>
                                <option value="logistics">Logistics</option>
                            </select>
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                        </Button>
                    </form>
                </Card>
            </div>
        </main>
    );
}
