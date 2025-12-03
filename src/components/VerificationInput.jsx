'use client';

import { useRef, useEffect } from 'react';

export default function VerificationInput({ length = 6, value, onChange, onComplete }) {
    const inputs = useRef([]);

    useEffect(() => {
        if (value && value.length === length) {
            onComplete?.(value);
        }
    }, [value, length, onComplete]);

    const handleChange = (e, index) => {
        const val = e.target.value;
        if (!/^\d*$/.test(val)) return; // Only numbers

        const newValue = value.split('');
        newValue[index] = val.slice(-1); // Take last char if multiple
        const newString = newValue.join('');

        onChange(newString);

        // Auto-focus next
        if (val && index < length - 1) {
            inputs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0) {
                // If empty, move back and delete
                const newValue = value.split('');
                newValue[index - 1] = '';
                onChange(newValue.join(''));
                inputs.current[index - 1].focus();
            } else {
                // Just clear current
                const newValue = value.split('');
                newValue[index] = '';
                onChange(newValue.join(''));
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, length).replace(/\D/g, '');
        onChange(pastedData);
        if (pastedData.length === length) {
            inputs.current[length - 1].focus();
        }
    };

    return (
        <div className="flex gap-1 sm:gap-2 justify-center">
            {[...Array(length)].map((_, i) => (
                <input
                    key={i}
                    ref={(el) => (inputs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] || ''}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    onPaste={handlePaste}
                    className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-bold border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
            ))}
        </div>
    );
}
