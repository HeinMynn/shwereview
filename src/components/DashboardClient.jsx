'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { Star, TrendingUp, Users, Building2 } from 'lucide-react';
import DashboardChart from '@/components/DashboardChart';
import DashboardReviews from '@/components/DashboardReviews';

export default function DashboardClient({ data }) {
    const { businesses, allReviews, reviewsByBusiness, submissions, myReviews, user } = data;

    const [selectedBusinessId, setSelectedBusinessId] = useState(
        businesses.length > 0 ? businesses[0]._id.toString() : null
    );

    if (!businesses || businesses.length === 0) {
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

    const selectedBusiness = businesses.find(b => b._id.toString() === selectedBusinessId) || businesses[0];
    const businessReviews = reviewsByBusiness[selectedBusinessId] || [];
    const metricKey = Object.keys(selectedBusiness.micro_metrics_aggregates || {})[0] || 'overall';

    const chartData = businessReviews.map(r => ({
        date: new Date(r.createdAt).toLocaleDateString(),
        value: metricKey === 'overall' ? r.overall_rating : (r.micro_ratings?.[metricKey] || 0)
    }));

    return (
        <main className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Owner Dashboard</h1>

                    {businesses.length > 1 ? (
                        <select
                            value={selectedBusinessId}
                            onChange={(e) => setSelectedBusinessId(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        >
                            {businesses.map(b => (
                                <option key={b._id} value={b._id.toString()}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="text-sm text-gray-600">
                            Managing: <span className="font-bold text-gray-900">{selectedBusiness.name}</span>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Total Businesses</div>
                            <div className="text-2xl font-bold">{businesses.length}</div>
                        </div>
                    </Card>

                    <Card className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                            <Star className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Current Rating</div>
                            <div className="text-2xl font-bold">{selectedBusiness.aggregate_rating?.toFixed(1) || 0}</div>
                        </div>
                    </Card>

                    <Card className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-full">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Reviews</div>
                            <div className="text-2xl font-bold">{businessReviews.length}</div>
                        </div>
                    </Card>

                    <Card className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Top Metric</div>
                            <div className="text-lg font-bold capitalize">{metricKey.replace('_', ' ')}</div>
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
                    {submissions.length > 0 && (
                        <Card className="p-6">
                            <h2 className="text-xl font-bold mb-4">My Submissions</h2>
                            <div className="space-y-4">
                                {submissions.map(sub => (
                                    <div key={sub._id} className="p-4 border rounded-lg flex justify-between items-center bg-white">
                                        <div>
                                            <div className="font-bold text-gray-900">{sub.name}</div>
                                            <div className="text-sm text-gray-600">{sub.address}</div>
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

                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">My Reviews</h2>
                        <DashboardReviews reviews={myReviews} />
                    </Card>
                </div>
            </div>
        </main>
    );
}
