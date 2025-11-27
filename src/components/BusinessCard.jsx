import Link from 'next/link';
import { Card } from './ui';
import { Star, MapPin } from 'lucide-react';

export default function BusinessCard({ business }) {
    return (
        <Link href={`/business/${business._id}`}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="aspect-video relative bg-gray-100">
                    {business.images?.[0] ? (
                        <img
                            src={business.images[0]}
                            alt={business.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                        </div>
                    )}
                    <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                        {business.category}
                    </div>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg line-clamp-1">{business.name}</h3>
                        <div className="flex items-center bg-yellow-100 px-1.5 py-0.5 rounded text-yellow-800 text-sm font-bold">
                            <Star className="w-3 h-3 fill-current mr-1" />
                            {business.aggregate_rating?.toFixed(1) || 'New'}
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">{business.description}</p>
                    <div className="flex items-center text-gray-500 text-xs mt-auto">
                        <MapPin className="w-3 h-3 mr-1" />
                        {business.address}
                    </div>
                </div>
            </Card>
        </Link>
    );
}
