import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import dbConnect from '@/lib/mongodb';
import { Business, Review } from '@/lib/models';
import DashboardChart from '@/components/DashboardChart';
import { Card } from '@/components/ui';
import { Star, TrendingUp, Users, Clock } from 'lucide-react';
import DashboardReviews from "@/components/DashboardReviews";

export const dynamic = 'force-dynamic';

async function getOwnerData() {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    await dbConnect();

    const ownerId = session.user.id;

    // Find business owned by this user
    const business = await Business.findOne({ owner_id: ownerId }).lean();

    // Find submissions by this user
    const submissions = await Business.find({ submitted_by: ownerId }).sort({ createdAt: -1 }).lean();

    // Find reviews by this user
    const myReviews = await Review.find({ user_id: ownerId })
        .populate('business_id', 'name category')
        .sort({ createdAt: -1 })
        .lean();

    if (!business) return { noBusiness: true, user: session.user, submissions: JSON.parse(JSON.stringify(submissions)), myReviews: JSON.parse(JSON.stringify(myReviews)) };

    const reviews = await Review.find({ business_id: business._id }).sort({ createdAt: 1 }).lean();

    const metricKey = Object.keys(business.micro_metrics_aggregates || {})[0] || 'overall';

    const chartData = reviews.map(r => ({
        date: new Date(r.createdAt).toLocaleDateString(),
        value: metricKey === 'overall' ? r.overall_rating : (r.micro_ratings?.[metricKey] || 0)
    }));

    return {
        business: JSON.parse(JSON.stringify(business)),
        submissions: JSON.parse(JSON.stringify(submissions)),
        myReviews: JSON.parse(JSON.stringify(myReviews)),
        reviewCount: reviews.length,
        chartData,
        metricKey,
        user: session.user
    };
}

export default async function Dashboard() {
    const data = await getOwnerData();

    if (!data) {
        redirect('/login');
    }

    const { business, submissions, user, myReviews } = data;

    if (data.noBusiness) {
        return (
            <main className="min-h-screen bg-slate-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-2xl font-bold mb-2">Welcome, {user.name}</h1>
                        <p className="text-gray-600">You don't have any businesses registered yet.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {submissions.length > 0 && (
                            <Card className="p-6">
                                <h2 className="text-xl font-bold mb-4">My Submissions</h2>
                                <div className="space-y-4">
                                    {submissions.map(sub => (
                                        <div key={sub._id} className="p-4 border rounded-lg flex justify-between items-center bg-white">
                                            <div>
                                                <div className="font-bold">{sub.name}</div>
                                                <div className="text-sm text-gray-500">{sub.address}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${sub.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    sub.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {sub.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        <Card className="p-6">
                            <h2 className="text-xl font-bold mb-4">My Reviews</h2>
                            <DashboardReviews reviews={myReviews} />
                        </Card>
                    </div>
                </div>
            </main>
        );
    }

    const { reviewCount, chartData, metricKey } = data;

    return (
        <main className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Owner Dashboard</h1>
                    <div className="text-sm text-gray-500">
                        Managing: <span className="font-bold text-slate-900">{business.name}</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                            <Star className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Overall Rating</div>
                            <div className="text-2xl font-bold">{business.aggregate_rating?.toFixed(1) || 0}</div>
                        </div>
                    </Card>

                    <Card className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-full">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Total Reviews</div>
                            <div className="text-2xl font-bold">{reviewCount}</div>
                        </div>
                    </Card>

                    <Card className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Top Metric</div>
                            <div className="text-2xl font-bold capitalize">{metricKey.replace('_', ' ')}</div>
                        </div>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <DashboardChart
                        title={`Trend: ${metricKey.replace('_', ' ')}`}
                        data={chartData}
                    />

                    <Card className="p-6">
                        <h3 className="text-lg font-bold mb-4">Recent Feedback</h3>
                        <div className="space-y-4">
                            <p className="text-gray-500 italic">Check the business profile for detailed comments.</p>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Submissions Section for Owners too */}
                    {submissions.length > 0 && (
                        <Card className="p-6">
                            <h2 className="text-xl font-bold mb-4">My Submissions</h2>
                            <div className="space-y-4">
                                {submissions.map(sub => (
                                    <div key={sub._id} className="p-4 border rounded-lg flex justify-between items-center bg-white">
                                        <div>
                                            <div className="font-bold">{sub.name}</div>
                                            <div className="text-sm text-gray-500">{sub.address}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${sub.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                sub.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {sub.status}
                                            </span>
                                            {sub.owner_id === user.id && (
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">Owner</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    import DashboardReviews from '@/components/DashboardReviews';

                    // ... (keep existing imports)

                    // ... (inside Dashboard component return)

                    {/* My Reviews Section for Owners too */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">My Reviews</h2>
                        <DashboardReviews reviews={myReviews} />
                    </Card>
                </div>
            </div>
        </main>
    );
}
