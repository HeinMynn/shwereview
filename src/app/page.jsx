import Link from 'next/link';
import Image from 'next/image';
import { Button, Card } from '@/components/ui';
import { Search, Star, MapPin, TrendingUp } from 'lucide-react';
import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';

export const dynamic = 'force-dynamic';

async function getBusinesses() {
    await dbConnect();
    const businesses = await Business.find({ status: 'approved' })
        .sort({ aggregate_rating: -1 })
        .limit(12)
        .lean();
    return JSON.parse(JSON.stringify(businesses));
}

export default async function Home() {
    const businesses = await getBusinesses();

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://placehold.co/1920x600/indigo/white?text=Pattern')] opacity-10 mix-blend-overlay"></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                        Discover & Review <br />
                        <span className="text-indigo-200">Local Businesses</span>
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 text-indigo-100 font-light">
                        Find the best places in town, curated by the community.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto mb-8">
                        <form action="/search" className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                name="q"
                                type="text"
                                placeholder="What are you looking for? (e.g., Sushi, Spa, Yangon)"
                                className="w-full pl-12 pr-4 py-4 rounded-full text-gray-900 shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-400/50 text-lg"
                            />
                            <Button
                                type="submit"
                                className="absolute right-2 top-2 bottom-2 rounded-full px-6 bg-indigo-600 hover:bg-indigo-700"
                            >
                                Search
                            </Button>
                        </form>
                    </div>

                    {/* Quick Categories */}
                    <div className="flex flex-wrap justify-center gap-3 text-sm font-medium">
                        <span className="text-indigo-200 py-2">Popular:</span>
                        {['Restaurant', 'Shop', 'Education', 'Logistics'].map((cat) => (
                            <Link key={cat} href={`/search?category=${cat.toLowerCase()}`}>
                                <span className="inline-block px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-colors cursor-pointer">
                                    {cat}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-indigo-600 mb-2">{businesses.length}+</div>
                            <div className="text-gray-600">Businesses Listed</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-indigo-600 mb-2">
                                {businesses.filter(b => b.aggregate_rating >= 4).length}
                            </div>
                            <div className="text-gray-600">4+ Star Rated</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-indigo-600 mb-2">
                                {businesses.length > 0 ? Math.max(...businesses.map(b => b.category ? 1 : 0)) : 0}
                            </div>
                            <div className="text-gray-600">Categories</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Businesses */}
            <section id="browse" className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Top Rated Businesses</h2>
                            <p className="text-gray-600 mt-2">Discover the best businesses in your area</p>
                        </div>
                    </div>

                    {businesses.length === 0 ? (
                        <Card className="p-12 text-center">
                            <p className="text-gray-500 mb-4">No businesses found yet.</p>
                            <Link href="/business/new">
                                <Button>Add the First Business</Button>
                            </Link>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {businesses.map((business) => (
                                <Link key={business._id} href={`/business/${business._id}`}>
                                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                                        <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-500 relative overflow-hidden">
                                            {business.images?.[0] ? (
                                                <Image
                                                    src={business.images[0]}
                                                    alt={business.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                                                    {business.name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                <span className="font-bold text-sm">
                                                    {business.aggregate_rating?.toFixed(1) || 'New'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                                                {business.name}
                                            </h3>
                                            <div className="flex items-center text-sm text-gray-600 mb-2">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                <span className="line-clamp-1">{business.address}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full capitalize">
                                                    {business.category}
                                                </span>
                                                {business.is_verified && (
                                                    <span className="text-xs text-green-600 font-semibold">✓ Verified</span>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Own a Business?
                    </h2>
                    <p className="text-xl text-indigo-100 mb-8">
                        List your business and connect with customers today
                    </p>
                    <Link href="/business/new">
                        <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
                            Add Your Business
                        </Button>
                    </Link>
                </div>
            </section>
        </main >
    );
}
