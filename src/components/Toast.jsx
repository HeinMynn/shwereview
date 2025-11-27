'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onClose) setTimeout(onClose, 300); // Wait for fade out
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible && !message) return null;

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                } ${type === 'success' ? 'bg-green-50 text-green-900 border border-green-200' : 'bg-red-50 text-red-900 border border-red-200'
                }`}
        >
            {type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
                <XCircle className="w-5 h-5 text-red-600" />
            )}
            <p className="font-medium text-sm">{message}</p>
            <button
                onClick={() => {
                    setIsVisible(false);
                    if (onClose) setTimeout(onClose, 300);
                }}
                className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors"
            >
                <X className="w-4 h-4 opacity-50" />
            </button>
        </div>
    );
}
