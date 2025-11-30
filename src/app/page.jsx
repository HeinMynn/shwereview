import Link from 'next/link';
import Image from 'next/image';
import { Button, Card } from '@/components/ui';
import { Search, Star, MapPin, TrendingUp, Users, FileText, Globe, CheckCircle, ArrowRight } from 'lucide-react';
import dbConnect from '@/lib/mongodb';
import { Business, HomepageConfig } from '@/lib/models';

export const revalidate = 60;

async function getBusinesses() {
    await dbConnect();
    const businesses = await Business.find({ status: 'approved' })
        .sort({ aggregate_rating: -1 })
        .limit(12)
        .lean();
    return JSON.parse(JSON.stringify(businesses));
}

async function getCategories() {
    await dbConnect();
    const categories = await Business.distinct('category', { status: 'approved' });
    return categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1));
}

async function getHomepageConfig() {
    await dbConnect();
    const config = await HomepageConfig.findOne().sort({ createdAt: -1 }).lean();
    if (!config) {
        return {
            hero: {
                title: 'Discover & Review <br /><span className="text-indigo-400">Local Businesses</span> in Myanmar',
                subtitle: 'Find trusted businesses, read honest reviews from real customers, and share your own experiences.',
                backgroundImage: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=2000&auto=format&fit=crop',
                searchPlaceholder: 'Search for restaurants, hotels, services...'
            },
            stats: [
                { label: 'Businesses Listed', value: '2,500+', icon: 'MapPin' },
                { label: 'Active Users', value: '50k+', icon: 'Users' },
                { label: 'Reviews Written', value: '125k+', icon: 'FileText' },
                { label: 'Cities Covered', value: '75+', icon: 'Globe' }
            ],
            cta: {
                title: 'Grow Your Business with ShweReview',
                subtitle: 'Claim your business profile, respond to reviews, and reach thousands of potential customers in Myanmar.',
                buttonText: 'List Your Business'
            },
            featuredCategories: [
                { name: 'Restaurants', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop', count: '1,200+' },
                { name: 'Hotels', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop', count: '800+' },
                { name: 'Shopping', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop', count: '2,500+' },
                { name: 'Services', image: 'https://images.unsplash.com/photo-1521791136064-7985c2d18854?q=80&w=800&auto=format&fit=crop', count: '1,500+' },
            ]
        };
    }
    return JSON.parse(JSON.stringify(config));
}

export default async function Home() {
    const businesses = await getBusinesses();
    const categories = await getCategories();
    const config = await getHomepageConfig();

    return (
        <main className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={config.hero.backgroundImage}
                        alt="Hero Background"
                        fill
                        priority
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/60" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight" dangerouslySetInnerHTML={{ __html: config.hero.title }}>
                    </h1>
                    <p className="text-lg md:text-xl mb-10 text-slate-200 max-w-2xl mx-auto font-light">
                        {config.hero.subtitle}
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-3xl mx-auto mb-10">
                        <form action="/search" className="relative group">
                            <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover:bg-white/30 transition-all" />
                            <div className="relative flex items-center bg-white rounded-full p-2 shadow-2xl">
                                <Search className="ml-4 text-slate-400 w-6 h-6" />
                                <input
                                    name="q"
                                    type="text"
                                    placeholder={config.hero.searchPlaceholder}
                                    className="w-full px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none text-lg bg-transparent"
                                />
                                <Button
                                    type="submit"
                                    className="rounded-full px-8 py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg transition-all hover:shadow-lg hover:scale-105"
                                >
                                    Search
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Quick Categories */}
                    <div className="flex flex-wrap justify-center gap-3">
                        {categories.length > 0 ? (
                            categories.map((cat) => (
                                <Link key={cat} href={`/search?category=${cat.toLowerCase()}`}>
                                    <span className="inline-block px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all cursor-pointer text-sm font-medium hover:scale-105">
                                        {cat}
                                    </span>
                                </Link>
                            ))
                        ) : (
                            // Fallback if no categories found
                            ['Restaurants', 'Hotels', 'Shopping', 'Services'].map((cat) => (
                                <Link key={cat} href={`/search?category=${cat.toLowerCase()}`}>
                                    <span className="inline-block px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all cursor-pointer text-sm font-medium hover:scale-105">
                                        {cat}
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {config.stats.map((stat, idx) => {
                            const Icon = { MapPin, Users, FileText, Globe }[stat.icon] || MapPin;
                            const colors = ['indigo', 'purple', 'pink', 'orange'];
                            const color = colors[idx % colors.length];

                            return (
                                <div key={idx} className="text-center">
                                    <div className="flex justify-center mb-3">
                                        <div className={`p-3 bg-${color}-50 rounded-full text-${color}-600`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                                    <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">{stat.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Featured Businesses */}
            <section id="browse" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Featured Businesses</h2>
                            <p className="text-slate-600 max-w-2xl text-lg">
                                Discover top-rated local businesses recommended by our community.
                            </p>
                        </div>
                        <Link href="/search">
                            <Button variant="outline" className="hidden md:flex items-center gap-2">
                                View All <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    {businesses.length === 0 ? (
                        <Card className="p-12 text-center bg-white border-dashed border-2 border-slate-200 shadow-none">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <MapPin className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No businesses yet</h3>
                            <p className="text-slate-500 mb-6">Be the first to add a business to our directory.</p>
                            <Link href="/business/new">
                                <Button>Add Business</Button>
                            </Link>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {businesses.map((business) => (
                                <Link key={business._id} href={`/business/${business._id}`} className="group">
                                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full border-slate-200 group-hover:-translate-y-1">
                                        <div className="h-56 bg-slate-200 relative overflow-hidden">
                                            {business.images?.[0] ? (
                                                <Image
                                                    src={business.images[0]}
                                                    alt={business.name}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                                                    <MapPin className="w-12 h-12" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                <span className="font-bold text-sm text-slate-900">
                                                    {business.aggregate_rating?.toFixed(1) || 'New'}
                                                </span>
                                            </div>
                                            <div className="absolute top-4 left-4">
                                                <span className="inline-block bg-slate-900/70 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full capitalize font-medium">
                                                    {business.category}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="font-bold text-xl text-slate-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                                {business.name}
                                            </h3>
                                            <div className="flex items-center text-slate-500 mb-4 text-sm">
                                                <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                                                <span className="line-clamp-1">{business.address}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                    <Users className="w-4 h-4" />
                                                    <span>{Math.floor(Math.random() * 50) + 10} reviews</span>
                                                </div>
                                                {business.is_verified && (
                                                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">
                                                        <CheckCircle className="w-3 h-3" /> Verified
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="mt-12 text-center md:hidden">
                        <Link href="/search">
                            <Button variant="outline" className="w-full">
                                View All Businesses
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">How ShweReview Works</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                            Simple steps to discover and share your experiences with local businesses.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-600 transition-colors duration-300">
                                <Search className="w-10 h-10 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">1. Search</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Find restaurants, hotels, shops, and services in your area using our smart search and filters.
                            </p>
                        </div>
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-600 transition-colors duration-300">
                                <Star className="w-10 h-10 text-purple-600 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">2. Review</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Share your honest experiences by rating businesses and writing detailed reviews to help others.
                            </p>
                        </div>
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-pink-600 transition-colors duration-300">
                                <TrendingUp className="w-10 h-10 text-pink-600 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">3. Discover</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Explore top-rated businesses and hidden gems recommended by our trusted community.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Top Categories Section */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Explore Top Categories</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                            Browse businesses by category to find exactly what you need.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {config.featuredCategories?.map((category) => (
                            <Link key={category.name} href={`/search?category=${category.name.toLowerCase()}`} className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-lg">
                                <Image
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 p-6 text-white">
                                    <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                                    <p className="text-sm text-white/80">{category.count} Listings</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">What Our Users Say</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                            Read reviews from our community members about their experiences.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: 'Thandar Hlaing', role: 'Foodie', text: "ShweReview helped me find the best Mohinga spot in Yangon! The reviews were spot on and the photos really helped.", rating: 5 },
                            { name: 'Kyaw Zin', role: 'Traveler', text: "I use this app whenever I travel to a new city in Myanmar. It's the most reliable source for finding good hotels and restaurants.", rating: 5 },
                            { name: 'May Myat', role: 'Shopper', text: "Great platform for discovering local businesses. I love that I can support small businesses by leaving positive reviews.", rating: 4 },
                        ].map((testimonial, idx) => (
                            <Card key={idx} className="p-8 bg-slate-50 border-none shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} />
                                    ))}
                                </div>
                                <p className="text-slate-700 mb-6 italic leading-relaxed">"{testimonial.text}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{testimonial.name}</div>
                                        <div className="text-sm text-slate-500">{testimonial.role}</div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-24 overflow-hidden">
                <div className="absolute inset-0 bg-indigo-900">
                    <Image
                        src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2000&auto=format&fit=crop"
                        alt="Business Meeting"
                        fill
                        className="object-cover opacity-20"
                    />
                </div>
                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        {config.cta.title}
                    </h2>
                    <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
                        {config.cta.subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/business/new">
                            <Button size="lg" className="bg-white text-indigo-900 hover:bg-indigo-50 px-8 py-6 text-lg font-bold w-full sm:w-auto">
                                {config.cta.buttonText}
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-bold w-full sm:w-auto">
                                Create User Account
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </main >
    );
}
