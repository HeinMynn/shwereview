'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function VerificationBanner() {
    const { data: session } = useSession();
    const [isVerified, setIsVerified] = useState(true); // Default to true to avoid flash
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (session) {
            // Check for dismissal
            try {
                const dismissedUntil = localStorage.getItem('verify_banner_dismissed_until');
                if (dismissedUntil && new Date(dismissedUntil) > new Date()) {
                    setDismissed(true);
                }
            } catch (e) {
                console.warn('LocalStorage access denied', e);
            }

            fetch('/api/auth/status')
                .then(res => res.json())
                .then(data => {
                    setIsVerified(data.verified);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [session]);

    const handleDismiss = () => {
        try {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            localStorage.setItem('verify_banner_dismissed_until', thirtyDaysFromNow.toISOString());
            setDismissed(true);
        } catch (e) {
            console.warn('LocalStorage access denied', e);
            setDismissed(true); // Dismiss for session only
        }
    };

    if (loading || !session || isVerified || dismissed) return null;

    return (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4">
                <div className="flex items-center gap-2 text-yellow-800 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Your phone number is not verified. Verify now to unlock full features.</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDismiss}
                        className="text-xs font-medium text-yellow-700 hover:text-yellow-900 px-3 py-1.5"
                    >
                        Later
                    </button>
                    <Link
                        href="/verify-phone"
                        className="text-xs font-bold bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded hover:bg-yellow-200 transition-colors"
                    >
                        Verify Now
                    </Link>
                </div>
            </div>
        </div>
    );
}
