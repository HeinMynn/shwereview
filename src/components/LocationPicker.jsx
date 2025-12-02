'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon issue
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function LocationMarker({ position, onLocationSelect }) {
    const map = useMapEvents({
        click(e) {
            onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });

    useEffect(() => {
        if (position && position.lat && position.lng) {
            map.flyTo([position.lat, position.lng], map.getZoom());
        }
    }, [position, map]);

    return position && position.lat && position.lng ? (
        <Marker position={[position.lat, position.lng]} icon={icon} />
    ) : null;
}

export default function LocationPicker({ position, onLocationSelect }) {
    // Default center (Yangon) if no position provided
    const defaultCenter = [16.8409, 96.1735];
    const center = position && position.lat && position.lng ? [position.lat, position.lng] : defaultCenter;

    return (
        <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} onLocationSelect={onLocationSelect} />
            </MapContainer>
            <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded shadow text-xs z-[1000] pointer-events-none">
                Click on the map to set location
            </div>
        </div>
    );
}
