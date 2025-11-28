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

    // Find ALL businesses owned by this user
    const businesses = await Business.find({ owner_id: ownerId })
        .sort({ createdAt: -1 })
        .lean();

    // Find submissions by this user
    const submissions = await Business.find({ submitted_by: ownerId }).sort({ createdAt: -1 }).lean();

    // Find reviews by this user
    const myReviews = await Review.find({ user_id: ownerId })
        .populate('business_id', 'name category')
        .sort({ createdAt: -1 })
        .lean();

    if (businesses.length === 0) {
        return {
            noBusiness: true,
            user: session.user,
            submissions: JSON.parse(JSON.stringify(submissions)),
            myReviews: JSON.parse(JSON.stringify(myReviews))
        };
    }

    // Get all reviews for all owned businesses
    const businessIds = businesses.map(b => b._id);
    const allReviews = await Review.find({ business_id: { $in: businessIds } })
        .populate('business_id', 'name')
        .sort({ createdAt: -1 })
        .lean();

    // Group reviews by business
    const reviewsByBusiness = {};
    allReviews.forEach(review => {
        const bizId = review.business_id._id.toString();
        if (!reviewsByBusiness[bizId]) {
            reviewsByBusiness[bizId] = [];
        }
        reviewsByBusiness[bizId].push(review);
    });

    return {
        businesses: JSON.parse(JSON.stringify(businesses)),
        allReviews: JSON.parse(JSON.stringify(allReviews)),
        reviewsByBusiness: JSON.parse(JSON.stringify(reviewsByBusiness)),
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
