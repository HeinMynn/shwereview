'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export default function BusinessGallery({ images, businessName }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) return null;

    const openLightbox = (index) => {
        setCurrentIndex(index);
        setLightboxOpen(true);
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        document.body.style.overflow = 'auto'; // Restore scrolling
    };

    const nextImage = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 mb-8 mt-8">
            {/* Grid Layout */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 h-[300px] md:h-[400px]">
                {/* Main large image */}
                <div
                    className="col-span-2 row-span-2 relative rounded-l-xl overflow-hidden cursor-pointer group h-full"
                    onClick={() => openLightbox(0)}
                >
                    <img
                        src={images[0]}
                        alt={`${businessName} main`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                {/* Secondary images */}
                <div className="hidden md:grid grid-cols-2 col-span-2 row-span-2 gap-2 md:gap-4 h-full">
                    {images.slice(1, 5).map((img, idx) => (
                        <div
                            key={idx}
                            className={`relative overflow-hidden cursor-pointer group h-full ${idx === 1 ? 'rounded-tr-xl' : ''
                                } ${idx === 3 || (idx === images.length - 2 && idx < 3) ? 'rounded-br-xl' : ''
                                }`}
                            onClick={() => openLightbox(idx + 1)}
                        >
                            <img
                                src={img}
                                alt={`${businessName} ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                            {/* "View All" Overlay on the last visible item if there are more */}
                            {idx === 3 && images.length > 5 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg backdrop-blur-[2px]">
                                    +{images.length - 5} more
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Mobile secondary images (just show 1 more or rely on main) */}
                <div
                    className="md:hidden col-span-2 row-span-1 relative rounded-r-xl overflow-hidden cursor-pointer group h-full"
                    onClick={() => openLightbox(1)}
                >
                    {images[1] && (
                        <img
                            src={images[1]}
                            alt={`${businessName} 2`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    )}
                </div>
            </div>

            <button
                onClick={() => openLightbox(0)}
                className="absolute bottom-4 right-8 bg-white/90 hover:bg-white text-gray-900 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm backdrop-blur-sm flex items-center gap-2 transition-colors md:hidden"
            >
                <Maximize2 className="w-4 h-4" /> View Gallery
            </button>

            {/* Lightbox Modal */}
            {lightboxOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm" onClick={closeLightbox}>
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-[110]"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <button
                        onClick={prevImage}
                        className="absolute left-4 text-white/70 hover:text-white p-2 z-[110] hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-10 h-10" />
                    </button>

                    <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
                        <img
                            src={images[currentIndex]}
                            alt={`${businessName} full ${currentIndex + 1}`}
                            className="max-w-full max-h-full object-contain shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm font-medium">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </div>

                    <button
                        onClick={nextImage}
                        className="absolute right-4 text-white/70 hover:text-white p-2 z-[110] hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ChevronRight className="w-10 h-10" />
                    </button>
                </div>
            )}
        </div>
    );
}
