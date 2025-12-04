import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import dbConnect from '@/lib/mongodb';
import { Review } from '@/lib/models';
import { updateBusinessAggregates } from '@/lib/aggregations';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'Super Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { reviewId, isHidden } = await req.json();

        if (!reviewId) {
            return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
        }

        await dbConnect();

        const review = await Review.findByIdAndUpdate(
            reviewId,
            { is_hidden: isHidden },
            { new: true }
        );

        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // Recalculate aggregates for the business
        await updateBusinessAggregates(review.business_id);



        return NextResponse.json({ success: true, review });
    } catch (error) {
        console.error('Error toggling review visibility:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
