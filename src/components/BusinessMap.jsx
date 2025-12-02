'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

export default function BusinessMap({ businesses }) {
    // Filter businesses that have coordinates
    const validBusinesses = businesses.filter(
        b => b.geo_coordinates && b.geo_coordinates.lat && b.geo_coordinates.lng
    );

    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        // If no businesses found, try to get user location
        if (validBusinesses.length === 0 && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.log('Geolocation denied or failed:', error);
                }
            );
        }
    }, [validBusinesses.length]);

    // Calculate center based on first business, user location, or default to Yangon
    const defaultCenter = [16.8409, 96.1735];
    const center = validBusinesses.length > 0
        ? [validBusinesses[0].geo_coordinates.lat, validBusinesses[0].geo_coordinates.lng]
        : (userLocation || defaultCenter);

    return (
        <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%', minHeight: '400px', borderRadius: '0.5rem' }}
            scrollWheelZoom={false}
        >
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
        </MapContainer>
    );
}
