
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business, BusinessMetric, Review, SystemConfig } from '@/lib/models';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Star, BarChart2, MousePointer, Lock } from 'lucide-react';
import { Card } from '@/components/ui';
import BusinessDashboardWrapper from '@/components/BusinessDashboardWrapper';
import AnalyticsView from '@/components/AnalyticsView';

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

    const isPro = business.subscription_tier === 'pro' && business.subscription_end_date && new Date(business.subscription_end_date) > new Date();

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

    // Fetch System Pricing
    const systemConfig = await SystemConfig.findOne({ key: 'pricing' }).lean();
    const proMonthlyPrice = systemConfig?.pricing?.pro_monthly || 29;

    return (
        <BusinessDashboardWrapper
            businessName={business.name}
            user={session.user}
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Analytics & Insights</h1>
                    <p className="text-slate-500">Track performance for {business.name}</p>
                </div>
                <div className="flex gap-4">
                    <Link href={`/business/${id}`}>
                        <button className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors">
                            View Public Page
                        </button>
                    </Link>
                    <Link href={`/checkout?plan=promote&businessId=${id}`}>
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
                            Start Ad Campaign
                        </button>
                    </Link>
                    {!isPro && (
                        <Link href={`/checkout?plan=pro&businessId=${id}`}>
                            <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:shadow-lg transition-shadow">
                                Upgrade to Pro
                            </button>
                        </Link>
                    )}
                </div>
            </div>

            <main>
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
                {/* 2. Interactive Analytics (Pro Only Features hidden inside component or passed as prop) */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            Performance Insights <span className="text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-0.5 rounded">PRO</span>
                        </h2>
                    </div>

                    <AnalyticsView businessId={id} isPro={isPro || isAdmin} />
                </div>
            </main>
        </BusinessDashboardWrapper>
    );
}
