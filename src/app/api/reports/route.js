import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Report, Review, User, Notification } from '@/lib/models';
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
        const review = await Review.findById(reviewId).populate('business_id', 'name');
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

        // Create notifications for all Super Admins
        const superAdmins = await User.find({ role: 'Super Admin' });
        const notificationPromises = superAdmins.map(admin =>
            Notification.create({
                user_id: admin._id,
                type: 'other',
                title: 'New Review Report',
                message: `${session.user.name} reported a review for "${reason}". ${customReason ? `Reason: ${customReason}` : ''}`,
                link: `/admin`,
                metadata: {
                    report_id: report._id.toString(),
                    review_id: reviewId,
                    business_id: review.business_id?._id?.toString(),
                    business_name: review.business_id?.name,
                    reporter_id: session.user.id,
                    reporter_name: session.user.name,
                    reason: reason
                }
            })
        );
        await Promise.all(notificationPromises);

        return NextResponse.json({ success: true, report });
    } catch (error) {
        console.error('Error submitting report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
