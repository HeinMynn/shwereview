'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { Star, TrendingUp, Users, Building2, LayoutGrid, List, MessageSquare, Plus } from 'lucide-react';
import DashboardChart from '@/components/DashboardChart';
import DashboardReviews from '@/components/DashboardReviews';
import Link from 'next/link';
import AdManager from '@/components/AdManager';

export default function DashboardClient({ data }) {
    const { businesses = [], recentReviews, chartData, totalReviewsReceived, submissions, myReviews, user } = data;
    const [activeTab, setActiveTab] = useState('overview');
    const [promotingBusinessId, setPromotingBusinessId] = useState(null);

    // Derived state for Overview
    const totalReviewsGiven = myReviews.length;
    const totalBusinessesOwned = businesses.length;
    // totalReviewsReceived is now passed from server

    // Calculate average rating across all owned businesses
    const totalRating = businesses.reduce((acc, b) => acc + (b.aggregate_rating || 0), 0);
    const avgRating = totalBusinessesOwned > 0 ? (totalRating / totalBusinessesOwned).toFixed(1) : 0;

    // DASHBOARD VIEW (For Business Owners)
    const Tabs = () => (
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mb-8 overflow-x-auto max-w-full">
            <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-700 hover:text-slate-900'
                    }`}
            >
                <LayoutGrid className="w-4 h-4 inline-block mr-2" />
                Overview
            </button>
            <button
                onClick={() => setActiveTab('businesses')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'businesses' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-700 hover:text-slate-900'
                    }`}
            >
                <Building2 className="w-4 h-4 inline-block mr-2" />
                My Businesses
            </button>
            <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'reviews' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-700 hover:text-slate-900'
                    }`}
            >
                <MessageSquare className="w-4 h-4 inline-block mr-2" />
                My Reviews
            </button>
            <button
                onClick={() => setActiveTab('ads')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'ads' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-700 hover:text-slate-900'
                    }`}
            >
                <TrendingUp className="w-4 h-4 inline-block mr-2" />
                Ad Manager
            </button>
        </div>
    );

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                        <p className="text-slate-600">Welcome back, {user.name}</p>
                    </div>
                    <Link href="/business/new">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="w-4 h-4 mr-2" /> Add New Business
                        </Button>
                    </Link>
                </div>

                <Tabs />

                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-700">Businesses Owned</div>
                                    <div className="text-2xl font-bold">{totalBusinessesOwned}</div>
                                </div>
                            </Card>
                            <Card className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-700">Reviews Given</div>
                                    <div className="text-2xl font-bold">{totalReviewsGiven}</div>
                                </div>
                            </Card>
                            {totalBusinessesOwned > 0 && (
                                <>
                                    <Card className="p-6 flex items-center gap-4">
                                        <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
                                            <Star className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-700">Avg Rating</div>
                                            <div className="text-2xl font-bold">{avgRating}</div>
                                        </div>
                                    </Card>
                                    <Card className="p-6 flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-700">Reviews Received</div>
                                            <div className="text-2xl font-bold">{totalReviewsReceived}</div>
                                        </div>
                                    </Card>
                                </>
                            )}
                        </div>
                        {/* Recent Activity / Charts */}
                        {totalBusinessesOwned > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <Card className="p-0 overflow-hidden">
                                    {(() => {
                                        // Use pre-calculated chart data from server
                                        // We need to reconstruct the series for the chart component
                                        // The chartData is already an array of objects: [{ date: '...', bizId1: 4.5, bizId2: 3.0 }, ...]

                                        if (!chartData || chartData.length === 0) {
                                            return (
                                                <div className="p-6 text-center text-gray-500">
                                                    No rating data available for the last 7 days.
                                                </div>
                                            );
                                        }

                                        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];
                                        const series = businesses.map((biz, index) => ({
                                            key: biz._id.toString(),
                                            name: biz.name,
                                            color: colors[index % colors.length]
                                        }));

                                        return (
                                            <DashboardChart
                                                title="Rating Trends by Business"
                                                data={chartData}
                                                series={series}
                                            />
                                        );
                                    })()}
                                </Card>
                                <Card className="p-6">
                                    <h3 className="text-lg font-bold mb-4">Recent Reviews Received</h3>
                                    {recentReviews && recentReviews.length > 0 ? (
                                        <DashboardReviews reviews={recentReviews} />
                                    ) : (
                                        <p className="text-slate-600">No reviews received yet.</p>
                                    )}
                                </Card>
                            </div>
                        ) : (
                            <Card className="p-8 text-center">
                                <div className="max-w-md mx-auto">
                                    <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Start Your Business Journey</h3>
                                    <p className="text-slate-600 mb-6">List your business on ShweReview to reach more customers and collect valuable feedback.</p>
                                    <Link href="/business/new">
                                        <Button>List Your Business</Button>
                                    </Link>
                                </div>
                            </Card>
                        )}
                    </div>
                )
                }

                {
                    activeTab === 'businesses' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-900">My Businesses & Submissions</h2>
                            </div>

                            {businesses.length === 0 && submissions.length === 0 ? (
                                <Card className="p-12 text-center">
                                    <p className="text-slate-600">You haven't listed any businesses yet.</p>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Active Businesses */}
                                    {businesses.map(business => (
                                        <Card key={business._id} className="p-6 hover:shadow-md transition-shadow">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden relative flex-shrink-0">
                                                        {business.images?.[0] ? (
                                                            <img src={business.images[0]} alt={business.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                <Building2 className="w-8 h-8" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-900">{business.name}</h3>
                                                        <p className="text-sm text-slate-600 mb-1">{business.address}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">Active</span>
                                                            <span className="flex items-center text-xs font-bold text-slate-900 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-200">
                                                                <Star className="w-3 h-3 mr-1 text-yellow-600 fill-current" />
                                                                {business.aggregate_rating?.toFixed(1) || 'New'}
                                                            </span>
                                                            {business.promoted_until && new Date(business.promoted_until) > new Date() && (
                                                                <span className="flex items-center text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                                                                    <TrendingUp className="w-3 h-3 mr-1" />
                                                                    Promoted
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 w-full md:w-auto">
                                                    <div className="flex gap-2">
                                                        <Link href={`/business/${business._id}`} className="flex-1 md:flex-none">
                                                            <Button variant="outline" className="w-full">View Page</Button>
                                                        </Link>
                                                        <Link href={`/business/${business._id}/edit`} className="flex-1 md:flex-none">
                                                            <Button className="w-full">Edit</Button>
                                                        </Link>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            className={`w-full ${promotingBusinessId === business._id ? 'bg-slate-100' : ''}`}
                                                            onClick={() => setPromotingBusinessId(promotingBusinessId === business._id ? null : business._id)}
                                                        >
                                                            <TrendingUp className="w-4 h-4 mr-2" />
                                                            {promotingBusinessId === business._id ? 'Close' : 'Promote'}
                                                        </Button>
                                                    </div>
                                                    {business.subscription_tier === 'pro' ? (
                                                        <div className="text-center">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                                Pro Plan Active
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <Link href={`/checkout?plan=pro&businessId=${business._id}`} className="w-full">
                                                            <Button variant="default" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0">
                                                                Upgrade to Pro
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                            {promotingBusinessId === business._id && (
                                                <AdManager business={business} />
                                            )}
                                        </Card>
                                    ))}

                                    {/* Pending Submissions */}
                                    {submissions.map(sub => (
                                        <Card key={sub._id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-75">
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900">{sub.name}</h3>
                                                <p className="text-sm text-slate-600 mb-1">{sub.address}</p>
                                                <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${sub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    sub.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100'
                                                    }`}>
                                                    {sub.status} Submission
                                                </span>
                                            </div>
                                            <Button disabled variant="outline">Processing</Button>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                }

                {
                    activeTab === 'reviews' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-900">My Reviews</h2>
                            {myReviews.length > 0 ? (
                                <DashboardReviews reviews={myReviews} />
                            ) : (
                                <Card className="p-12 text-center">
                                    <p className="text-slate-600">You haven't written any reviews yet.</p>
                                    <Link href="/search" className="mt-4 inline-block">
                                        <Button>Browse Businesses</Button>
                                    </Link>
                                </Card>
                            )}
                        </div>
                    )
                }


                {
                    activeTab === 'ads' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Ad Manager</h2>
                                    <p className="text-slate-600">Manage your promotions and boost visibility.</p>
                                </div>
                            </div>

                            {businesses.length === 0 ? (
                                <Card className="p-12 text-center">
                                    <p className="text-slate-600">You need to list a business before you can advertise.</p>
                                    <Link href="/business/new" className="mt-4 inline-block">
                                        <Button>List Your Business</Button>
                                    </Link>
                                </Card>
                            ) : (
                                <div className="space-y-8">
                                    {businesses.map(business => (
                                        <Card key={business._id} className="overflow-hidden">
                                            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden relative flex-shrink-0">
                                                        {business.images?.[0] ? (
                                                            <img src={business.images[0]} alt={business.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                <Building2 className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-900">{business.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {business.promoted_until && new Date(business.promoted_until) > new Date() ? (
                                                                <span className="flex items-center text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                                                                    <TrendingUp className="w-3 h-3 mr-1" />
                                                                    Active Promotion
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                                    Not Promoted
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => setPromotingBusinessId(promotingBusinessId === business._id ? null : business._id)}
                                                    className={promotingBusinessId === business._id ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
                                                >
                                                    {promotingBusinessId === business._id ? 'Close Manager' : 'Manage Ads'}
                                                </Button>
                                            </div>

                                            {/* Ad Manager Interface */}
                                            {promotingBusinessId === business._id && (
                                                <div className="p-6 border-b border-slate-100 bg-slate-50">
                                                    <AdManager business={business} />
                                                </div>
                                            )}

                                            {/* Campaign History */}
                                            <div className="p-6">
                                                <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                                    <List className="w-4 h-4 text-slate-400" />
                                                    Campaign History
                                                </h4>
                                                {business.ad_campaigns && business.ad_campaigns.length > 0 ? (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm text-left">
                                                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                                                <tr>
                                                                    <th className="px-4 py-3 rounded-l-lg">Start Date</th>
                                                                    <th className="px-4 py-3">End Date</th>
                                                                    <th className="px-4 py-3">Amount</th>
                                                                    <th className="px-4 py-3 rounded-r-lg">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {business.ad_campaigns.slice().reverse().map((campaign, idx) => {
                                                                    const isActive = new Date(campaign.end_date) > new Date();
                                                                    return (
                                                                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                                                            <td className="px-4 py-3 font-medium text-slate-900">
                                                                                {new Date(campaign.start_date).toLocaleDateString()}
                                                                            </td>
                                                                            <td className="px-4 py-3 text-slate-600">
                                                                                {new Date(campaign.end_date).toLocaleDateString()}
                                                                            </td>
                                                                            <td className="px-4 py-3 text-slate-600">
                                                                                ${campaign.amount_paid}
                                                                            </td>
                                                                            <td className="px-4 py-3">
                                                                                {isActive ? (
                                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                                        Active
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                                                                        Completed
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-slate-500 italic">No past campaigns found.</p>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                }
            </div >
        </main >
    );
}
