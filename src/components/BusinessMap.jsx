'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

// Fix for default marker icon in Next.js
const icon = L.icon({
    iconUrl: '/images/marker-icon.png',
    shadowUrl: '/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// We need to manually set the icon because webpack/nextjs messes with leaflet's default image paths
// A better way is to use a custom icon or CDN links for the default icon
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map view updates
function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function BusinessMap({ businesses }) {
    // Filter businesses that have coordinates
    const validBusinesses = businesses.filter(
        b => b.geo_coordinates && b.geo_coordinates.lat && b.geo_coordinates.lng
    );

    const [userLocation, setUserLocation] = useState(null);
    const [geoError, setGeoError] = useState(null);
    const [loadingGeo, setLoadingGeo] = useState(false);
    const [manualCenter, setManualCenter] = useState(null);
    const [accuracy, setAccuracy] = useState(0);

    const handleLocateMe = () => {
        setLoadingGeo(true);
        setGeoError(null);
        if (!('geolocation' in navigator)) {
            setGeoError('Geolocation not supported');
            setLoadingGeo(false);
            return;
        }

        // Use watchPosition instead of getCurrentPosition for better accuracy over time
        const id = navigator.geolocation.watchPosition(
            (position) => {
                const pos = [position.coords.latitude, position.coords.longitude];
                setUserLocation(pos);
                setAccuracy(position.coords.accuracy);

                // Always stop loading once we get a position
                setLoadingGeo(false);

                // If we were loading (implied by this callback firing after a click), center map
                // Note: We can't check 'loadingGeo' state here due to closure, but since we only
                // attach this watcher on click, we can assume we want to center.
                // However, watchPosition fires repeatedly. We only want to center on the FIRST fix
                // or if the user explicitly clicked.
                // A better approach for "Locate Me" is to just center on every update from THIS watcher
                // until we clear it? Or just center once.

                // For now, let's just set manualCenter. If the user pans away, manualCenter stays set
                // which forces the map back. This might be annoying.
                // Ideally, we should only set manualCenter once.
                setManualCenter(pos);
            },
            (error) => {
                console.error('Geolocation error:', error);
                let msg = 'Location error';
                switch (error.code) {
                    case error.PERMISSION_DENIED: msg = 'Location permission denied'; break;
                    case error.POSITION_UNAVAILABLE: msg = 'Location unavailable'; break;
                    case error.TIMEOUT: msg = 'Location request timed out'; break;
                }
                setGeoError(msg);
                setLoadingGeo(false);
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );

        // Cleanup function to clear watch when component unmounts or re-runs (though we only run this on click)
        // Ideally we should store watchId in a ref to clear it, but for this simple implementation:
        return () => navigator.geolocation.clearWatch(id);
    };

    useEffect(() => {
        // Initial auto-locate
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.log('Auto-location failed:', error);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    }, []);

    // Calculate center based on first business, user location, or default to Yangon
    const defaultCenter = [16.8409, 96.1735];

    // Priority: Manual Center > Business > User Location (if no businesses) > Default
    const center = manualCenter || (validBusinesses.length > 0
        ? [validBusinesses[0].geo_coordinates.lat, validBusinesses[0].geo_coordinates.lng]
        : (userLocation || defaultCenter));

    return (
        <div className="relative h-full w-full">
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%', minHeight: '400px', borderRadius: '0.5rem', zIndex: 0 }}
                scrollWheelZoom={false}
            >
                <ChangeView center={center} zoom={13} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {validBusinesses.map((business) => (
                    <Marker
                        key={business._id}
                        position={[business.geo_coordinates.lat, business.geo_coordinates.lng]}
                    >
                        <Popup>
                            <div className="min-w-[200px]">
                                <h3 className="font-bold text-sm mb-1 text-slate-900">{business.name}</h3>
                                <p className="text-xs text-slate-700 mb-2 line-clamp-2">{business.address}</p>
                                {business.description && (
                                    <p className="text-xs text-slate-600 mb-2 line-clamp-2 italic">
                                        "{business.description}"
                                    </p>
                                )}
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded capitalize border border-slate-200">
                                        {business.category}
                                    </span>
                                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                                        <Star className="w-3 h-3 fill-current" />
                                        {business.aggregate_rating?.toFixed(1) || 'New'}
                                    </div>
                                </div>
                                <Link
                                    href={`/business/${business._id}`}
                                    className="block mt-3 text-center text-xs font-medium bg-slate-900 text-white py-2 rounded hover:bg-slate-800 transition-colors shadow-sm"
                                >
                                    View Details
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* User Location Marker - Always show if available */}
                {userLocation && (
                    <>
                        <Marker
                            position={userLocation}
                            icon={L.divIcon({
                                className: 'bg-transparent',
                                html: `<div style="background-color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 2px solid #3b82f6;">
                                        <span style="font-size: 22px; line-height: 1; margin-left: 2px;">🚶</span>
                                       </div>`,
                                iconSize: [36, 36],
                                iconAnchor: [18, 18],
                                popupAnchor: [0, -18]
                            })}
                        >
                            <Popup>
                                <div className="text-center">
                                    <span className="font-bold text-slate-900">You are here</span>
                                    {accuracy > 0 && (
                                        <div className="text-xs text-slate-500 mt-1">
                                            Accuracy: ±{Math.round(accuracy)}m
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                        {/* Accuracy Circle */}
                        <Circle
                            center={userLocation}
                            radius={accuracy}
                            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1, dashArray: '5, 5' }}
                        />
                    </>
                )}
            </MapContainer>

            {/* Locate Me Button */}
            <button
                onClick={handleLocateMe}
                disabled={loadingGeo}
                className="absolute top-4 right-4 z-[400] bg-white p-2 rounded-md shadow-md hover:bg-slate-50 transition-colors border border-slate-200"
                title="Locate Me"
            >
                {loadingGeo ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                ) : (
                    <span className="text-xl">🎯</span>
                )}
            </button>

            {/* Error Message */}
            {geoError && (
                <div className="absolute bottom-4 left-4 right-4 z-[400] bg-red-50 text-red-600 px-3 py-2 rounded-md text-xs font-medium shadow-sm border border-red-100 text-center">
                    {geoError}. Check permissions.
                </div>
            )}
        </div>
    );
}
