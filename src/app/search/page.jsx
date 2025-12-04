import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';
import { Card, Button, Input } from '@/components/ui';
import Link from 'next/link';
import { Star, MapPin, Search, Filter, ChevronLeft, ChevronRight, Map as MapIcon, List } from 'lucide-react';
import Image from 'next/image';
import MapWrapper from '@/components/MapWrapper';
import SearchHeader from '@/components/SearchHeader';

export const dynamic = 'force-dynamic';

async function getBusinesses(searchParams) {
    await dbConnect();

    const { q, category, subcategory, rating, page = 1 } = searchParams;
    const limit = 12;
    const skip = (page - 1) * limit;

    // Build Match Stage
    let matchStage = { status: 'approved' };

    if (q) {
        // Use regex for partial matching on name, description, and tags
        const regex = new RegExp(q, 'i'); // Case-insensitive regex
        matchStage.$or = [
            { name: { $regex: regex } },
            { description: { $regex: regex } },
            { tags: { $in: [regex] } } // Match if any tag matches the regex
        ];
    }

    if (category && category !== 'all') {
        matchStage.category = category;
    }

    if (subcategory) {
        matchStage.subcategory = subcategory;
    }

    if (rating) {
        matchStage.aggregate_rating = { $gte: parseFloat(rating) };
    }

    if (rating) {
        matchStage.aggregate_rating = { $gte: parseFloat(rating) };
    }

    // Build Pipeline
    const pipeline = [
        { $match: matchStage },
        {
            $addFields: {
                isPromoted: {
                    $cond: {
                        if: { $gt: ["$promoted_until", new Date()] },
                        then: 1,
                        else: 0
                    }
                }
            }
        }
    ];

    // Sorting
    let sortStage = { isPromoted: -1 };
    if (q) {
        // For regex search, we don't have a textScore, so we sort by rating or promoted status
        // We could potentially add a custom score based on where the match occurred (name > tags > description)
        // but for now, let's stick to promoted > rating
        sortStage.aggregate_rating = -1;
    } else {
        sortStage.aggregate_rating = -1;
    }
    pipeline.push({ $sort: sortStage });

    // Pagination (Facet)
    pipeline.push({
        $facet: {
            metadata: [{ $count: "total" }],
            data: [
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        name: 1, description: 1, address: 1, images: 1, category: 1,
                        aggregate_rating: 1, status: 1, geo_coordinates: 1, review_count: 1,
                        promoted_until: 1, tags: 1 // Ensure we return this for the UI
                    }
                }
            ]
        }
    });

    const result = await Business.aggregate(pipeline);

    const totalBusinesses = result[0].metadata[0]?.total || 0;
    const businesses = result[0].data || [];
    const totalPages = Math.ceil(totalBusinesses / limit);

    return {
        businesses: JSON.parse(JSON.stringify(businesses)),
        totalPages,
        currentPage: parseInt(page),
        totalBusinesses
    };
}

export default async function SearchPage({ searchParams }) {
    const params = await searchParams;
    const page = parseInt(params.page) || 1;
    const { businesses, totalPages, currentPage, totalBusinesses } = await getBusinesses({ ...params, page });

    const query = params.q || '';
    const category = params.category || 'all';
    const subcategory = params.subcategory || '';
    const rating = params.rating || '';
    const showMap = params.map === 'true';

    // Helper to generate pagination links
    const createPageLink = (newPage) => {
        const newParams = new URLSearchParams();
        if (query) newParams.set('q', query);
        if (category && category !== 'all') newParams.set('category', category);
        if (subcategory) newParams.set('subcategory', subcategory);
        if (rating) newParams.set('rating', rating);
        if (showMap) newParams.set('map', 'true');
        newParams.set('page', newPage.toString());
        return `/search?${newParams.toString()}`;
    };

    // Helper to toggle map view
    const toggleMapLink = () => {
        const newParams = new URLSearchParams();
        if (query) newParams.set('q', query);
        if (category && category !== 'all') newParams.set('category', category);
        if (subcategory) newParams.set('subcategory', subcategory);
        if (rating) newParams.set('rating', rating);
        newParams.set('page', page.toString());

        if (showMap) {
            newParams.delete('map');
        } else {
            newParams.set('map', 'true');
        }
        return `/search?${newParams.toString()}`;
    };

    return (
        <main className="min-h-screen bg-slate-50 pb-12 flex flex-col">
            {/* Search Header */}
            {/* Search Header */}
            <SearchHeader
                query={query}
                category={category}
                subcategory={subcategory}
                rating={rating}
                showMap={showMap}
                toggleMapLink={toggleMapLink()}
            />

            {/* Results Content */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex justify-between items-end">
                    <h1 className="text-2xl font-bold text-slate-900">
                        {totalBusinesses} result{totalBusinesses !== 1 ? 's' : ''} found
                    </h1>
                    {totalBusinesses > 0 && (
                        <p className="text-sm text-slate-500">
                            Showing {(currentPage - 1) * 12 + 1}-{Math.min(currentPage * 12, totalBusinesses)} of {totalBusinesses}
                        </p>
                    )}
                </div>

                <div className={`grid gap-6 ${showMap ? 'lg:grid-cols-3 lg:h-[calc(100vh-250px)]' : 'grid-cols-1'}`}>

                    {/* List View */}
                    <div className={`${showMap ? 'lg:col-span-2 overflow-y-auto pr-2' : ''}`}>
                        {businesses.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-lg border border-slate-200">
                                <div className="text-4xl mb-4">🔍</div>
                                <h3 className="text-lg font-medium text-gray-900">No businesses found</h3>
                                <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
                                <Link href="/search">
                                    <Button variant="outline" className="mt-4">Clear all filters</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className={`grid grid-cols-1 ${showMap ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
                                {businesses.map((business) => (
                                    <Link key={business._id} href={`/business/${business._id}`}>
                                        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                                            <div className="h-48 bg-gray-200 relative">
                                                {business.images?.[0] ? (
                                                    <Image
                                                        src={business.images[0]}
                                                        alt={business.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold bg-gray-100">
                                                        {business.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                                    <span className="font-bold text-xs">
                                                        {business.aggregate_rating?.toFixed(1) || 'New'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 ml-1">
                                                        ({business.review_count || 0})
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{business.name}</h3>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full capitalize text-slate-600">
                                                            {business.category}
                                                        </span>
                                                        {business.promoted_until && new Date(business.promoted_until) > new Date() && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full uppercase tracking-wide">
                                                                Ad
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">
                                                    {business.description}
                                                </p>
                                                <div className="flex items-center text-xs text-gray-500 mt-auto pt-4 border-t border-gray-100">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    <span className="line-clamp-1">{business.address}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="mt-12 flex justify-center items-center gap-2 pb-8">
                                <Link href={currentPage > 1 ? createPageLink(currentPage - 1) : '#'}>
                                    <Button
                                        variant="outline"
                                        disabled={currentPage <= 1}
                                        className={currentPage <= 1 ? 'opacity-50 pointer-events-none' : ''}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                                    </Button>
                                </Link>

                                <div className="flex items-center gap-1 mx-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                                        if (
                                            p === 1 ||
                                            p === totalPages ||
                                            (p >= currentPage - 1 && p <= currentPage + 1)
                                        ) {
                                            return (
                                                <Link key={p} href={createPageLink(p)}>
                                                    <Button
                                                        variant={currentPage === p ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="w-8 h-8 p-0"
                                                    >
                                                        {p}
                                                    </Button>
                                                </Link>
                                            );
                                        } else if (
                                            p === currentPage - 2 ||
                                            p === currentPage + 2
                                        ) {
                                            return <span key={p} className="text-gray-400">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <Link href={currentPage < totalPages ? createPageLink(currentPage + 1) : '#'}>
                                    <Button
                                        variant="outline"
                                        disabled={currentPage >= totalPages}
                                        className={currentPage >= totalPages ? 'opacity-50 pointer-events-none' : ''}
                                    >
                                        Next <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Map View */}
                    {showMap && (
                        <div className="hidden lg:block lg:col-span-1 sticky top-36 h-full">
                            <MapWrapper businesses={businesses} />
                        </div>
                    )}

                    {/* Mobile Map View (Full Screen Overlay or similar, but for now just stacking) */}
                    {showMap && (
                        <div className="lg:hidden h-[300px] w-full mb-6 order-first rounded-lg overflow-hidden shadow-sm">
                            <MapWrapper businesses={businesses} />
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
