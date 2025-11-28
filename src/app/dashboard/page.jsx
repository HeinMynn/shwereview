import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import dbConnect from '@/lib/mongodb';
import { Business, Review } from '@/lib/models';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

async function getOwnerData() {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    await dbConnect();

    const ownerId = session.user.id;

    // 1. Find ALL businesses owned by this user
    const businesses = await Business.find({ owner_id: ownerId })
        .select('name address images category status claim_status aggregate_rating micro_metrics_aggregates')
        .sort({ createdAt: -1 })
        .lean();

    // 2. Find submissions by this user
    const submissions = await Business.find({ submitted_by: ownerId })
        .select('name address status')
        .sort({ createdAt: -1 })
        .lean();

    // 3. Find reviews by this user
    const myReviews = await Review.find({ user_id: ownerId })
        .populate('business_id', 'name category')
        .sort({ createdAt: -1 })
        .limit(20) // Limit to recent 20 reviews
        .lean();

    if (businesses.length === 0) {
        return {
            noBusiness: true,
            user: session.user,
            submissions: JSON.parse(JSON.stringify(submissions)),
            myReviews: JSON.parse(JSON.stringify(myReviews))
        };
    }

    const businessIds = businesses.map(b => b._id);

    // 4. Efficiently fetch recent reviews for "Recent Feedback" (Limit 5)
    const recentReviews = await Review.find({ business_id: { $in: businessIds } })
        .populate('business_id', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

    // 5. Aggregation for Rating Trends (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const ratingTrends = await Review.aggregate([
        {
            $match: {
                business_id: { $in: businessIds },
                createdAt: { $gte: sevenDaysAgo }
            }
        },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    business_id: "$business_id"
                },
                averageRating: { $avg: "$overall_rating" },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.date": 1 } }
    ]);

    // 6. Aggregation for Total Reviews Received
    const totalReviewsResult = await Review.aggregate([
        { $match: { business_id: { $in: businessIds } } },
        { $count: "total" }
    ]);
    const totalReviewsReceived = totalReviewsResult[0]?.total || 0;

    // Process trends data for the chart
    const reviewsByBusiness = {}; // Kept for compatibility if needed, but now we use aggregated data
    // We'll reconstruct the chart data structure expected by the client
    const chartDataMap = {};

    ratingTrends.forEach(item => {
        const date = item._id.date;
        const bizId = item._id.business_id.toString();

        if (!chartDataMap[date]) {
            chartDataMap[date] = { date };
        }
        chartDataMap[date][bizId] = Number(item.averageRating.toFixed(1));
    });

    const chartData = Object.values(chartDataMap).sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
        businesses: JSON.parse(JSON.stringify(businesses)),
        recentReviews: JSON.parse(JSON.stringify(recentReviews)), // Renamed from allReviews to be clear it's partial
        chartData: JSON.parse(JSON.stringify(chartData)),
        totalReviewsReceived,
        submissions: JSON.parse(JSON.stringify(submissions)),
        myReviews: JSON.parse(JSON.stringify(myReviews)),
        user: session.user
    };
}

export default async function Dashboard() {
    const data = await getOwnerData();

    if (!data) {
        redirect('/login');
    }

    // If user has no businesses and is not an admin, redirect to profile
    // (getOwnerData returns noBusiness: true in this case)
    if (data.noBusiness && data.user.role !== 'Super Admin') {
        redirect('/profile');
    }

    return <DashboardClient data={data} />;
}
