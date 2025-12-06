
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business, BusinessMetric, Review } from '@/lib/models';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Star, BarChart2, MousePointer, Lock } from 'lucide-react';
import { Card } from '@/components/ui';

export default async function DashboardPage({ params }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect(`/login?callbackUrl=/business/${id}/dashboard`);
    }

    await dbConnect();
    const business = await Business.findById(id).lean();

    if (!business) return notFound();

    // Authorization: Owner or Admin
    const isOwner = business.owner_id?.toString() === session.user.id;
    const isAdmin = session.user.role === 'Super Admin';

    if (!isOwner && !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Unauthorized</h1>
                    <p className="text-gray-600">You do not have permission to view this dashboard.</p>
                    <Link href={`/business/${id}`} className="text-indigo-600 hover:underline mt-4 inline-block">
                        Return to Business Page
                    </Link>
                </div>
            </div>
        );
    }

    const isPro = business.subscription_tier === 'pro';

    // Fetch Lifetime Stats (Free Tier)
    const totalReviews = await Review.countDocuments({ business_id: id, is_deleted: false });

    // Aggregate total views from metrics
    const metricsResult = await BusinessMetric.aggregate([
        { $match: { business_id: business._id } },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
                totalClicksWebsite: { $sum: "$clicks_website" },
                totalClicksCall: { $sum: "$clicks_call" },
                totalClicksDirection: { $sum: "$clicks_direction" },
            }
        }
    ]);

    const stats = metricsResult[0] || { totalViews: 0, totalClicksWebsite: 0, totalClicksCall: 0, totalClicksDirection: 0 };

    // Fetch Trend Data for Pro (Last 30 Days)
    let trendData = [];
    if (isPro || isAdmin) { // Admins can see pro view for testing
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        trendData = await BusinessMetric.find({
            business_id: id,
            date: { $gte: thirtyDaysAgo }
        }).sort({ date: 1 }).lean();
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/business/${id}`} className="text-slate-500 hover:text-slate-900">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900">Owner Dashboard: {business.name}</h1>
                    </div>
                    <div className="flex gap-4">
                        <Link href={`/business/${id}`}>
                            <button className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors">
                                View Public Page
                            </button>
                        </Link>
                        {!isPro && (
                            <Link href={`/checkout?plan=pro&businessId=${id}`}>
                                <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:shadow-lg transition-shadow">
                                    Upgrade to Pro
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* 1. Free Stats (Lifetime) */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        Overview <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Free Included</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-6 border-l-4 border-l-indigo-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Total Page Views</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalViews.toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-full">
                                    <Users className="w-6 h-6 text-indigo-600" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-l-4 border-l-yellow-400">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Average Rating</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">{business.aggregate_rating?.toFixed(1) || '0.0'}</p>
                                </div>
                                <div className="p-3 bg-yellow-50 rounded-full">
                                    <Star className="w-6 h-6 text-yellow-500" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-l-4 border-l-teal-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Total Reviews</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">{totalReviews}</p>
                                </div>
                                <div className="p-3 bg-teal-50 rounded-full">
                                    <Star className="w-6 h-6 text-teal-600" />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* 2. Pro Stats (Trends & Actions) */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            Performance Insights <span className="text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-0.5 rounded">PRO</span>
                        </h2>
                    </div>

                    {!isPro && (
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 text-center text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="active relative z-10 max-w-2xl mx-auto">
                                <Lock className="w-12 h-12 mx-auto mb-4 text-indigo-400" />
                                <h3 className="text-2xl font-bold mb-2">Unlock Customer Insights</h3>
                                <p className="text-slate-300 mb-6">
                                    See exactly how customers interact with your page. Track website clicks, phone calls, and view daily traffic trends.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left max-w-lg mx-auto bg-white/5 p-4 rounded-lg border border-white/10">
                                    <div className="p-2">
                                        <div className="text-xs text-slate-400 mb-1">Customer Actions</div>
                                        <div className="text-lg font-bold text-slate-200 blur-sm">142 Clicks</div>
                                    </div>
                                    <div className="p-2 border-l border-white/10">
                                        <div className="text-xs text-slate-400 mb-1">Views (30d)</div>
                                        <div className="text-lg font-bold text-slate-200 blur-sm">+24%</div>
                                    </div>
                                    <div className="p-2 border-l border-white/10">
                                        <div className="text-xs text-slate-400 mb-1">Top Keyword</div>
                                        <div className="text-lg font-bold text-slate-200 blur-sm">Pizza</div>
                                    </div>
                                </div>
                                <Link href={`/checkout?plan=pro&businessId=${id}`}>
                                    <button className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold hover:bg-indigo-50 transition-colors">
                                        Unlock Pro for $29/mo
                                    </button>
                                </Link>
                            </div>
                        </div>
                    )}

                    {isPro && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Actions Card */}
                            <Card className="p-6">
                                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <MousePointer className="w-5 h-5 text-indigo-600" />
                                    Customer Actions (Last 30 Days)
                                </h3>
                                {/* Mock Chart Placeholder - In real app use Recharts */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <span className="text-sm font-medium text-slate-600">Website Clicks</span>
                                        <span className="font-bold text-slate-900">{stats.totalClicksWebsite}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <span className="text-sm font-medium text-slate-600">Phone Calls</span>
                                        <span className="font-bold text-slate-900">{stats.totalClicksCall}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <span className="text-sm font-medium text-slate-600">Get Directions</span>
                                        <span className="font-bold text-slate-900">{stats.totalClicksDirection}</span>
                                    </div>
                                </div>
                            </Card>

                            {/* Trends Card */}
                            <Card className="p-6">
                                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <BarChart2 className="w-5 h-5 text-indigo-600" />
                                    Traffic Trend
                                </h3>
                                <div className="h-48 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                    <p className="text-slate-400 text-sm">Traffic chart visualization would go here</p>
                                    {/* {JSON.stringify(trendData)} */}
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
