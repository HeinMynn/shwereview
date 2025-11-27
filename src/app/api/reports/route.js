import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Report, Review } from '@/lib/models';
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
        const { reviewId, reason, customReason } = body;

        if (!reviewId || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if review exists
        const review = await Review.findById(reviewId);
        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // Check if user already reported this review
        const existingReport = await Report.findOne({ reporter_id: session.user.id, review_id: reviewId });
        if (existingReport) {
            return NextResponse.json({ error: 'You have already reported this review' }, { status: 409 });
        }

        const report = await Report.create({
            reporter_id: session.user.id,
            review_id: reviewId,
            reason,
            custom_reason: customReason,
        });

        return NextResponse.json({ success: true, report });
    } catch (error) {
        console.error('Error submitting report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
