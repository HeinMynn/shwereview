'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import Link from 'next/link';
import VerificationInput from '@/components/VerificationInput';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailParam = searchParams.get('email');

    const [email, setEmail] = useState(emailParam || '');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(180); // 3 minutes

    useEffect(() => {
        let timer;
        if (resendCountdown > 0) {
            timer = setInterval(() => {
                setResendCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendCountdown]);

    const handleResend = async () => {
        setError('');
        setSuccess('');
        setIsResending(true);

        try {
            const res = await fetch('/api/auth/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to resend code');
            }

            setSuccess('Verification code resent! Please check your email.');
            setResendCountdown(180); // Reset timer
        } catch (err) {
            setError(err.message);
        } finally {
            setIsResending(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            setSuccess('Email verified successfully! Redirecting to login...');
            setTimeout(() => {
                router.push('/login?verified=true');
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-md p-8">
            <h1 className="text-2xl font-bold mb-2 text-center">Verify Your Email</h1>
            <p className="text-center text-gray-600 mb-6">
                We sent a verification code to <b>{email}</b>. Please enter it below.
            </p>

            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={!!emailParam} // Disable if passed from URL
                    />
                </div>
                <div>
                    <div>
                        <label className="block text-sm font-medium mb-3 text-center">Verification Code</label>
                        <VerificationInput
                            value={code}
                            onChange={setCode}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Verifying...' : 'Verify Email'}
                    </Button>
                </div>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResend}
                    disabled={resendCountdown > 0 || isResending}
                    className="w-full"
                >
                    {isResending ? 'Sending...' : resendCountdown > 0 ? `Resend in ${Math.floor(resendCountdown / 60)}:${(resendCountdown % 60).toString().padStart(2, '0')}` : 'Resend Code'}
                </Button>
            </div>

            <div className="mt-4 text-center text-sm">
                <Link href="/login" className="text-blue-600 hover:underline">Back to Login</Link>
            </div>
        </Card>
    );
}

export default function VerifyPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <VerifyContent />
            </Suspense>
        </div>
    );
}
