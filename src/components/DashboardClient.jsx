'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { Star, TrendingUp, Users, Building2, LayoutGrid, List, MessageSquare, Plus } from 'lucide-react';
import DashboardChart from '@/components/DashboardChart';
import DashboardReviews from '@/components/DashboardReviews';
import Link from 'next/link';

export default function DashboardClient({ data }) {
    const { businesses = [], allReviews, reviewsByBusiness, submissions, myReviews, user } = data;
    const [activeTab, setActiveTab] = useState('overview');

    // Derived state for Overview
    const totalReviewsGiven = myReviews.length;
    const totalBusinessesOwned = businesses.length;
    const totalReviewsReceived = allReviews?.length || 0;

    // Calculate average rating across all owned businesses
    const totalRating = businesses.reduce((acc, b) => acc + (b.aggregate_rating || 0), 0);
    const avgRating = totalBusinessesOwned > 0 ? (totalRating / totalBusinessesOwned).toFixed(1) : 0;

    const Tabs = () => (
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mb-8 inline-flex">
            <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
            >
                <LayoutGrid className="w-4 h-4 inline-block mr-2" />
                Overview
            </button>
            <button
                onClick={() => setActiveTab('businesses')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'businesses' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
            >
                <Building2 className="w-4 h-4 inline-block mr-2" />
                My Businesses
            </button>
            <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'reviews' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
            >
                <MessageSquare className="w-4 h-4 inline-block mr-2" />
                My Reviews
            </button>
        </div>
    );

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                        <p className="text-slate-500">Welcome back, {user.name}</p>
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
                                    <div className="text-sm text-gray-600">Businesses Owned</div>
                                    <div className="text-2xl font-bold">{totalBusinessesOwned}</div>
                                </div>
                            </Card>
                            <Card className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Reviews Given</div>
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
                                            <div className="text-sm text-gray-600">Avg Rating</div>
                                            <div className="text-2xl font-bold">{avgRating}</div>
                                        </div>
                                    </Card>
                                    <Card className="p-6 flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Reviews Received</div>
                                            <div className="text-2xl font-bold">{totalReviewsReceived}</div>
                                        </div>
                                    </Card>
                                </>
                            )}
                        </div>

                        {/* Recent Activity / Charts could go here */}
                        {totalBusinessesOwned > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <Card className="p-6">
                                    <h3 className="text-lg font-bold mb-4">Performance Overview</h3>
                                    <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                        <p className="text-slate-400">Select a business in "My Businesses" for detailed analytics</p>
                                    </div>
                                </Card>
                                <Card className="p-6">
                                    <h3 className="text-lg font-bold mb-4">Recent Reviews Received</h3>
                                    {allReviews && allReviews.length > 0 ? (
                                        <DashboardReviews reviews={allReviews.slice(0, 3)} />
                                    ) : (
                                        <p className="text-slate-500">No reviews received yet.</p>
                                    )}
                                </Card>
                            </div>
                        ) : (
                            <Card className="p-8 text-center">
                                <div className="max-w-md mx-auto">
                                    <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Start Your Business Journey</h3>
                                    <p className="text-slate-500 mb-6">List your business on ShweReview to reach more customers and collect valuable feedback.</p>
                                    <Link href="/business/new">
                                        <Button>List Your Business</Button>
                                    </Link>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === 'businesses' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">My Businesses & Submissions</h2>
                        </div>

                        {businesses.length === 0 && submissions.length === 0 ? (
                            <Card className="p-12 text-center">
                                <p className="text-slate-500">You haven't listed any businesses yet.</p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {/* Active Businesses */}
                                {businesses.map(business => (
                                    <Card key={business._id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
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
                                                <p className="text-sm text-slate-500 mb-1">{business.address}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">Active</span>
                                                    <span className="flex items-center text-xs font-medium text-yellow-600">
                                                        <Star className="w-3 h-3 mr-1 fill-current" />
                                                        {business.aggregate_rating?.toFixed(1) || 'New'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <Link href={`/business/${business._id}`} className="flex-1 md:flex-none">
                                                <Button variant="outline" className="w-full">View Page</Button>
                                            </Link>
                                            <Button className="flex-1 md:flex-none">Manage</Button>
                                        </div>
                                    </Card>
                                ))}

                                {/* Pending Submissions */}
                                {submissions.map(sub => (
                                    <Card key={sub._id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-75">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">{sub.name}</h3>
                                            <p className="text-sm text-slate-500 mb-1">{sub.address}</p>
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
                )}

                {activeTab === 'reviews' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-900">My Reviews</h2>
                        {myReviews.length > 0 ? (
                            <DashboardReviews reviews={myReviews} />
                        ) : (
                            <Card className="p-12 text-center">
                                <p className="text-slate-500">You haven't written any reviews yet.</p>
                                <Link href="/search" className="mt-4 inline-block">
                                    <Button>Browse Businesses</Button>
                                </Link>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
