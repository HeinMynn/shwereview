import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';
import BusinessCard from '@/components/BusinessCard';
import { Input } from '@/components/ui';
import { Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getBusinesses(query = '', category = '', minRating = 0) {
  await dbConnect();
  const filter = { status: 'approved' };

  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ];
  }

  if (category && category !== 'all') {
    filter.category = category;
  }

  if (minRating > 0) {
    filter.aggregate_rating = { $gte: parseFloat(minRating) };
  }

  const businesses = await Business.find(filter).lean();
  return JSON.parse(JSON.stringify(businesses));
}

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const query = params?.q || '';
  const category = params?.category || '';
  const minRating = params?.rating || 0;

  const businesses = await getBusinesses(query, category, minRating);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Find the Best <span className="text-yellow-400">Everything</span>
          </h1>
          <p className="text-lg text-slate-300 mb-8">
            Detailed reviews for Restaurants, Retail, and Logistics.
          </p>

          <form action="/" className="max-w-3xl mx-auto bg-white p-2 rounded-lg flex flex-col md:flex-row gap-2 text-slate-900">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="Search businesses..."
                className="pl-10 h-12 border-0 focus-visible:ring-0"
              />
            </div>
            <select
              name="category"
              defaultValue={category}
              className="h-12 px-4 rounded-md border-l border-gray-200 bg-transparent focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="restaurant">Restaurant</option>
              <option value="retail">Retail</option>
              <option value="logistics">Logistics</option>
            </select>
            <select
              name="rating"
              defaultValue={minRating}
              className="h-12 px-4 rounded-md border-l border-gray-200 bg-transparent focus:outline-none"
            >
              <option value="0">Any Rating</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
            <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold px-8 py-3 rounded-md transition-colors">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            {businesses.length} Results Found
          </h2>
        </div>

        {businesses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No businesses found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <BusinessCard key={business._id} business={business} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
