import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import dbConnect from '@/lib/mongodb';
import { Review } from '@/lib/models';
import ProfileClient from '@/components/ProfileClient';

export const dynamic = 'force-dynamic';

async function getProfileData() {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    await dbConnect();

    const userId = session.user.id;

    // Find reviews by this user
    const myReviews = await Review.find({ user_id: userId })
        .populate('business_id', 'name category')
        .sort({ createdAt: -1 })
        .lean();

    return {
        myReviews: JSON.parse(JSON.stringify(myReviews)),
        user: session.user
    };
}

export default async function ProfilePage() {
    const data = await getProfileData();

    if (!data) {
        redirect('/login');
    }

    return <ProfileClient data={data} />;
}
