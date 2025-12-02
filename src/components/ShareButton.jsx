'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Share2, Check, Copy } from 'lucide-react';
import Toast from '@/components/Toast';

export default function ShareButton({ title, text, url, className, variant = 'outline' }) {
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleShare = async () => {
        const shareData = {
            title: title || 'ShweReview',
            text: text || 'Check out this business on ShweReview!',
            url: url || window.location.href,
        };

        // Check for Secure Context (HTTPS) which is required for Web Share API
        if (window.isSecureContext === false) {
            console.warn('Web Share API requires a secure context (HTTPS). Falling back to clipboard.');
        }

        if (navigator.share) {
            // Validate data if canShare is supported
            if (navigator.canShare && !navigator.canShare(shareData)) {
                console.warn('Share data is not valid for Web Share API. Falling back to clipboard.');
                copyToClipboard(shareData.url);
                return;
            }

            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                    copyToClipboard(shareData.url);
                }
            }
        } else {
            copyToClipboard(shareData.url);
        }
    };

    const copyToClipboard = async (link) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(link);
                setToastMessage('Link copied to clipboard!');
                setShowToast(true);
            } else {
                throw new Error('Clipboard API unavailable');
            }
        } catch (err) {
            // Fallback for older browsers or non-secure contexts
            try {
                const textArea = document.createElement("textarea");
                textArea.value = link;

                // Ensure it's not visible but part of the DOM
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);

                textArea.focus();
                textArea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (successful) {
                    setToastMessage('Link copied to clipboard!');
                    setShowToast(true);
                } else {
                    throw new Error('Fallback copy failed');
                }
            } catch (fallbackErr) {
                console.error('Failed to copy:', fallbackErr);
                setToastMessage('Failed to copy link');
                setShowToast(true);
            }
        }
    };

    return (
        <>
            <Button
                variant={variant}
                className={className}
                onClick={handleShare}
            >
                <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            {showToast && (
                <Toast
                    message={toastMessage}
                    type="success"
                    onClose={() => setShowToast(false)}
                />
            )}
        </>
    );
}
