'use client';

import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';

export default function VerifiedBadge({ className = "w-5 h-5" }) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div
            className="group relative flex items-center inline-block"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => {
                e.stopPropagation(); // Prevent triggering parent clicks (e.g. card expansion)
                setShowTooltip(!showTooltip);
            }}
        >
            <BadgeCheck className={`${className} text-white fill-blue-500 cursor-pointer`} />

            {/* Tooltip */}
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded transition-opacity whitespace-nowrap z-50 ${showTooltip ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                Phone number verified by telegram
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
        </div>
    );
}
