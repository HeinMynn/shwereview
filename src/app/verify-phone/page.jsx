'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Card } from '@/components/ui';
import { Send, CheckCircle, Loader2 } from 'lucide-react';

export default function VerifyPhonePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [botLink, setBotLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);

    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Poll for status
    useEffect(() => {
        if (!botLink || verified || error) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/auth/status');
                const data = await res.json();

                if (data.verified) {
                    setVerified(true);
                    clearInterval(interval);
                    setTimeout(() => router.push('/dashboard'), 3000);
                } else if (data.error === 'duplicate_phone') {
                    setError('This phone number is already registered to another account. Please use a different Telegram account.');
                    setVerifying(false);
                    clearInterval(interval);
                }
            } catch (error) {
                console.error('Polling error', error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [botLink, verified, error, router]);

    const startVerification = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/telegram/generate', { method: 'POST' });
            const data = await res.json();
            if (data.link) {
                setBotLink(data.link);
                setVerifying(true);
                // Open in new tab
                window.open(data.link, '_blank');
            }
        } catch (error) {
            console.error('Failed to generate link', error);
            setError('Failed to generate verification link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 text-center">
                {verified ? (
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Phone Verified!</h1>
                        <p className="text-slate-600">Thank you for verifying your phone number. Redirecting you to the dashboard...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                            <Send className="w-8 h-8 ml-1" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Verify with Telegram</h1>
                            <p className="text-slate-600">
                                Click the button below to open our Telegram Bot. Tap <b>Start</b> and then <b>Share Contact</b> to verify your phone number instantly.
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                                {error}
                            </div>
                        )}

                        {!verifying ? (
                            <Button
                                size="lg"
                                className="w-full bg-[#0088cc] hover:bg-[#0077b5]"
                                onClick={startVerification}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                {error ? 'Try Again' : 'Open Telegram'}
                            </Button>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm animate-pulse">
                                    Waiting for verification... Please complete the steps in Telegram.
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => window.open(botLink, '_blank')}
                                >
                                    Open Telegram Again
                                </Button>
                            </div>
                        )}

                        <div className="text-xs text-slate-400">
                            This process is free and secure. We only use your phone number for account verification.
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
