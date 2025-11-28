import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';
import { Card, Button, Input } from '@/components/ui';
import Link from 'next/link';
import { Star, MapPin, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

async function getBusinesses(searchParams) {
    await dbConnect();

    const { q, category, rating, page = 1 } = searchParams;
    const limit = 12;
    const skip = (page - 1) * limit;

    let query = { status: 'approved' };

    if (q) {
        query.$text = { $search: q };
    }

    if (category && category !== 'all') {
        query.category = category;
    }

    if (rating) {
        query.aggregate_rating = { $gte: parseFloat(rating) };
    }

    const totalBusinesses = await Business.countDocuments(query);
    const totalPages = Math.ceil(totalBusinesses / limit);

    let businessQuery = Business.find(query)
        .select('name description address images category aggregate_rating status')
        .skip(skip)
        .limit(limit);

    // If searching by text, sort by relevance score
    if (q) {
        businessQuery = businessQuery.sort({ score: { $meta: "textScore" } });
    } else {
        businessQuery = businessQuery.sort({ aggregate_rating: -1 });
    }

    const businesses = await businessQuery.lean();

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
    const rating = params.rating || '';

    // Helper to generate pagination links
    const createPageLink = (newPage) => {
        const newParams = new URLSearchParams();
        if (query) newParams.set('q', query);
        if (category && category !== 'all') newParams.set('category', category);
        if (rating) newParams.set('rating', rating);
        newParams.set('page', newPage.toString());
        return `/search?${newParams.toString()}`;
    };

    return (
        <main className="min-h-screen bg-slate-50 pb-12">
            {/* Search Header */}
            <div className="bg-white border-b border-slate-200 sticky top-16 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <form className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                name="q"
                                defaultValue={query}
                                placeholder="Search businesses, services, or places..."
                                className="pl-10 w-full text-slate-900"
                            />
                        </div>
                        <Button type="submit">Search</Button>
                    </form>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 overflow-x-auto pb-2">
                        <div className="flex items-center text-sm font-medium text-gray-700 mr-2">
                            <Filter className="w-4 h-4 mr-1" /> Filters:
                        </div>

                        {/* Category Filter */}
                        <div className="flex gap-2">
                            {['all', 'restaurant', 'shop', 'logistics', 'education'].map((cat) => (
                                <Link
                                    key={cat}
                                    href={`/search?q=${query}&category=${cat}&rating=${rating}`}
                                >
                                    <span className={`
                                        px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors
                                        ${category === cat
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                                    `}>
                                        {cat}
                                    </span>
                                </Link>
                            ))}
                        </div>

                        <div className="w-px h-6 bg-gray-300 mx-2 hidden sm:block"></div>

                        {/* Rating Filter */}
                        <div className="flex gap-2">
                            {[4, 3].map((r) => (
                                <Link
                                    key={r}
                                    href={`/search?q=${query}&category=${category}&rating=${rating === r.toString() ? '' : r}`}
                                >
                                    <span className={`
                                        px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 transition-colors
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

            {/* Results */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                            </div>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{business.name}</h3>
                                                <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full capitalize text-slate-600">
                                                    {business.category}
                                                </span>
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

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="mt-12 flex justify-center items-center gap-2">
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
                                        // Show first, last, current, and neighbors
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
                    </>
                )}
            </div>
        </main>
    );
}
