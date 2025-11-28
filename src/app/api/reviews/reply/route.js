import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Review, Business } from '@/lib/models';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { reviewId, replyText } = body;

        if (!reviewId || !replyText) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const review = await Review.findById(reviewId).populate('business_id');
        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // Check if user is the owner of the business
        if (review.business_id.owner_id.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Only the business owner can reply to this review' }, { status: 403 });
        }

        review.owner_reply = {
            text: replyText,
            createdAt: new Date()
        };

        await review.save();

        return NextResponse.json({ success: true, review });
    } catch (error) {
        console.error('Error submitting reply:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
