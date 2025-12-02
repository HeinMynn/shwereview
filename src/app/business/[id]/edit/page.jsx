'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui';
import BusinessForm from '@/components/BusinessForm';
import Link from 'next/link';

export default function EditBusinessPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (id) {
            fetchBusiness();
        }
    }, [id, status, router]);

    const fetchBusiness = async () => {
        try {
            const res = await fetch(`/api/businesses/${id}`);
            if (!res.ok) throw new Error('Failed to fetch business');
            const data = await res.json();
            setBusiness(data.business);
        } catch (err) {
            console.error(err);
            setError('Failed to load business details.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (formData) => {
        setIsSubmitting(true);
        setSubmitError('');
        setSuccess('');

        try {
            const res = await fetch(`/api/businesses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update business');
            }

            setSuccess('Business updated successfully!');
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);
        } catch (err) {
            console.error(err);
            setSubmitError(err.message);
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
                <Card className="p-6 text-center text-red-600">
                    <p>{error}</p>
                    <Link href="/dashboard" className="text-indigo-600 hover:underline mt-4 block">
                        Return to Dashboard
                    </Link>
                </Card>
            </div>
        );
    }

    // Basic client-side permission check (server also checks)
    const isOwner = session?.user?.id === business?.owner_id?._id || session?.user?.id === business?.owner_id;
    const isAdmin = session?.user?.role === 'Super Admin';

    if (!isOwner && !isAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
                <Card className="p-6 text-center">
                    <p className="text-red-600 font-bold mb-2">Access Denied</p>
                    <p className="text-gray-600">You do not have permission to edit this business.</p>
                    <Link href="/dashboard" className="text-indigo-600 hover:underline mt-4 block">
                        Return to Dashboard
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Edit Business</h1>
                    <Link href="/dashboard" className="text-slate-600 hover:text-indigo-600">
                        Cancel
                    </Link>
                </div>

                {submitError && (
                    <div className="bg-red-50 text-red-700 p-3 rounded mb-6 text-sm border border-red-200">
                        {submitError}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 text-green-700 p-3 rounded mb-6 text-sm border border-green-200">
                        {success}
                    </div>
                )}

                <BusinessForm
                    initialData={business}
                    onSubmit={handleUpdate}
                    isSubmitting={isSubmitting}
                    submitLabel="Save Changes"
                />
            </div>
        </main>
    );
}
