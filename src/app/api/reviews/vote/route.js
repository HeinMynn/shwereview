import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import { Review, ReviewVote } from '@/lib/models';

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { reviewId, voteType } = await request.json();

        if (!['helpful', 'not_helpful'].includes(voteType)) {
            return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
        }

        const userId = session.user.id;
        const review = await Review.findById(reviewId);

        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // Check existing vote
        const existingVote = await ReviewVote.findOne({ review_id: reviewId, user_id: userId });

        let action = 'created';
        let previousVoteType = null;

        if (existingVote) {
            previousVoteType = existingVote.vote_type;
            if (existingVote.vote_type === voteType) {
                // Toggle off
                await ReviewVote.findByIdAndDelete(existingVote._id);
                action = 'removed';
            } else {
                // Switch vote
                existingVote.vote_type = voteType;
                await existingVote.save();
                action = 'switched';
            }
        } else {
            // Create new vote
            await ReviewVote.create({
                review_id: reviewId,
                user_id: userId,
                vote_type: voteType
            });
        }

        // Update counts on Review model
        // We could use $inc but we need to handle the logic based on action
        // To be safe and accurate, let's count documents.
        // Optimization: Use $inc based on action to avoid full count if performance is key,
        // but counting ensures consistency. Given scale, $inc is better.

        const updates = {};

        if (action === 'created') {
            updates[voteType === 'helpful' ? 'helpful_count' : 'not_helpful_count'] = 1;
        } else if (action === 'removed') {
            updates[voteType === 'helpful' ? 'helpful_count' : 'not_helpful_count'] = -1;
        } else if (action === 'switched') {
            updates[voteType === 'helpful' ? 'helpful_count' : 'not_helpful_count'] = 1;
            updates[previousVoteType === 'helpful' ? 'helpful_count' : 'not_helpful_count'] = -1;
        }

        // Use native collection to bypass Mongoose schema strictness if model is stale
        const updatedReviewRaw = await Review.collection.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(reviewId) },
            { $inc: updates },
            { returnDocument: 'after' }
        );

        // updatedReviewRaw might differ based on driver version, usually .value or the doc itself
        const updatedReview = updatedReviewRaw || {};

        return NextResponse.json({
            success: true,
            action,
            helpful_count: updatedReview.helpful_count || 0,
            not_helpful_count: updatedReview.not_helpful_count || 0,
            user_vote: action === 'removed' ? null : voteType
        });

    } catch (error) {
        console.error('Vote error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
