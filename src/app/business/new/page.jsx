'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import Link from 'next/link';
import BusinessForm from '@/components/BusinessForm';

export default function NewBusinessPage() {
    const { data: session } = useSession();
    const router = useRouter();

    // Steps: 'role' -> 'form'
    const [step, setStep] = useState('role');
    const [role, setRole] = useState(null); // 'owner' | 'customer'

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');

    const handleRoleSelect = (selectedRole) => {
        setRole(selectedRole);
        setStep('form');
    };

    const handleFormSubmit = async (formData) => {
        if (!session) return;

        setIsSubmitting(true);
        setErrors({});
        setSuccess('');

        try {
            const res = await fetch('/api/businesses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to create business');

            const data = await res.json();
            const businessId = data.business._id;

            setSuccess('Business submitted successfully!');

            setTimeout(() => {
                if (role === 'owner') {
                    router.push(`/business/${businessId}/claim`);
                } else {
                    router.push(`/business/${businessId}`);
                }
            }, 1500);
        } catch (error) {
            console.error(error);
            setErrors(prev => ({ ...prev, submit: 'Error submitting business. Please try again.' }));
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
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Add a New Business</h1>

                {step === 'role' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card
                            className="p-8 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-indigo-600 group"
                            onClick={() => handleRoleSelect('owner')}
                        >
                            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                                <span className="text-2xl">💼</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">I own this business</h3>
                            <p className="text-gray-600">
                                List your business, claim ownership, and manage your presence.
                            </p>
                        </Card>

                        <Card
                            className="p-8 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-600 group"
                            onClick={() => handleRoleSelect('customer')}
                        >
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                                <span className="text-2xl">👤</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">I'm a customer</h3>
                            <p className="text-gray-600">
                                Add a place you visited to share your experience and review.
                            </p>
                        </Card>
                    </div>
                )}

                {step === 'form' && (
                    <>
                        {errors.submit && (
                            <div className="bg-red-50 text-red-700 p-3 rounded mb-6 text-sm border border-red-200">
                                {errors.submit}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 text-green-700 p-3 rounded mb-6 text-sm border border-green-200">
                                {success}
                            </div>
                        )}

                        <BusinessForm
                            onSubmit={handleFormSubmit}
                            isSubmitting={isSubmitting}
                            submitLabel={role === 'owner' ? 'Submit & Claim Business' : 'Submit Business'}
                            role={role}
                            showRoleSelector={true}
                            onRoleChange={setStep}
                        />
                    </>
                )}
            </div>
        </main >
    );
}
