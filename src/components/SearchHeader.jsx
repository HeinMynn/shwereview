'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Filter, Map as MapIcon, List, Star } from 'lucide-react';
import { Button, Input } from '@/components/ui';

export default function SearchHeader({ query, category, rating, showMap, toggleMapLink }) {
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Minimum scroll amount to trigger change (prevent jitter)
            if (Math.abs(currentScrollY - lastScrollY.current) < 10) {
                return;
            }

            // Show header if scrolling up or at the top
            if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
                setIsVisible(true);
            }
            // Hide header if scrolling down and not at the top
            else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                setIsVisible(false);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div
            className={`bg-white border-b border-slate-200 sticky z-40 shadow-sm transition-[top] duration-300 ease-in-out ${isVisible ? 'top-16' : '-top-48'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                <form className="flex gap-2" action="/search">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                        <Input
                            name="q"
                            defaultValue={query}
                            placeholder="Search..."
                            className="pl-9 sm:pl-10 w-full text-slate-900 h-9 sm:h-10 text-sm"
                        />
                        {/* Preserve other params */}
                        {category && category !== 'all' && <input type="hidden" name="category" value={category} />}
                        {rating && <input type="hidden" name="rating" value={rating} />}
                        {showMap && <input type="hidden" name="map" value="true" />}
                    </div>
                    <Button type="submit" size="sm" className="h-9 sm:h-10 px-3 sm:px-4">Search</Button>
                </form>

                {/* Filters & Map Toggle - Scrollable Row on Mobile */}
                <div className="flex items-center gap-2 mt-2 sm:mt-4 overflow-x-auto pb-1 sm:pb-2 no-scrollbar">
                    {/* Map Toggle - Fixed at start */}
                    <Link href={toggleMapLink} className="flex-shrink-0 mr-2">
                        <Button variant={showMap ? "default" : "outline"} size="sm" className="h-8 text-xs whitespace-nowrap">
                            {showMap ? <List className="w-3 h-3 mr-1" /> : <MapIcon className="w-3 h-3 mr-1" />}
                            {showMap ? 'List' : 'Map'}
                        </Button>
                    </Link>

                    <div className="h-6 w-px bg-gray-200 flex-shrink-0 hidden sm:block"></div>

                    <div className="flex items-center text-sm font-medium text-gray-700 mr-1 flex-shrink-0 hidden sm:flex">
                        <Filter className="w-4 h-4 mr-1" /> Filters:
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2 flex-shrink-0">
                        {['all', 'restaurant', 'shop', 'logistics', 'education'].map((cat) => (
                            <Link
                                key={cat}
                                href={`/search?q=${query}&category=${cat}&rating=${rating}${showMap ? '&map=true' : ''}`}
                            >
                                <span className={`
                                    px-3 py-1 rounded-full text-xs sm:text-sm font-medium capitalize transition-colors whitespace-nowrap block
                                    ${category === cat
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                                `}>
                                    {cat}
                                </span>
                            </Link>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0"></div>

                    {/* Rating Filter */}
                    <div className="flex gap-2 flex-shrink-0">
                        {[4, 3].map((r) => (
                            <Link
                                key={r}
                                href={`/search?q=${query}&category=${category}&rating=${rating === r.toString() ? '' : r}${showMap ? '&map=true' : ''}`}
                            >
                                <span className={`
                                    px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 transition-colors whitespace-nowrap
                                    ${rating === r.toString()
                                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}
                                `}>
                                    {r}+ <Star className="w-3 h-3 fill-current" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
