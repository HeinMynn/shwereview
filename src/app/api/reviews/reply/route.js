import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Review, Business, Notification } from '@/lib/models';
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

        // Check if it's an edit or a new reply
        const isEdit = review.owner_reply && review.owner_reply.text;

        review.owner_reply = {
            text: replyText,
            createdAt: new Date()
        };

        await review.save();

        // Notify the reviewer
        // Avoid notifying if the reviewer is the owner (unlikely given the check above, but good practice)
        if (review.user_id.toString() !== session.user.id) {
            await Notification.create({
                user_id: review.user_id,
                type: 'reply_received',
                title: isEdit ? 'Reply Updated' : 'New Reply to Your Review',
                message: isEdit
                    ? `${review.business_id.name} has updated their reply to your review.`
                    : `${review.business_id.name} has replied to your review.`,
                link: `/business/${review.business_id._id}`,
                is_read: false,
            });
        }

        return NextResponse.json({ success: true, review });
    } catch (error) {
        console.error('Error submitting reply:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
