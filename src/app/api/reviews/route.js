import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Review, Business, User } from '@/lib/models';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { updateBusinessAggregates } from '@/lib/aggregations';

export async function POST(request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.account_status === 'suspended' || user.account_status === 'banned') {
            return NextResponse.json({ error: `Your account is ${user.account_status}. You cannot post reviews.` }, { status: 403 });
        }

        const body = await request.json();
        const { businessId, textContent, microRatings, media, categorySnapshot, isAnonymous } = body;

        // Basic validation
        if (!businessId || !microRatings || !categorySnapshot) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user is the owner
        const business = await Business.findById(businessId);
        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        if (business.owner_id && business.owner_id.toString() === user._id.toString()) {
            return NextResponse.json({ error: 'Business owners cannot review their own business' }, { status: 403 });
        }

        // Check if user already reviewed this business
        const existingReview = await Review.findOne({ user_id: user._id, business_id: businessId });
        if (existingReview) {
            return NextResponse.json({ error: 'You have already reviewed this business' }, { status: 409 });
        }

        // Calculate overall rating for this review
        const ratings = Object.values(microRatings);
        const overallRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

        // Create Review
        const review = await Review.create({
            user_id: user._id,
            business_id: businessId,
            text_content: textContent,
            media: media || [],
            overall_rating: overallRating,
            micro_ratings: microRatings,
            category_snapshot: categorySnapshot,
            verified_purchase: true, // Simulating verification for now
            is_anonymous: isAnonymous || false,
        });

        // Update Business Aggregates (Reuse logic)
        await updateBusinessAggregates(businessId);

        // Fetch updated business
        const updatedBusiness = await Business.findById(businessId);

        return NextResponse.json({ success: true, review, business: updatedBusiness });
    } catch (error) {
        console.error('Error submitting review:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { reviewId, textContent, microRatings, isAnonymous } = body;

        const review = await Review.findById(reviewId);
        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        if (review.user_id.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Update fields
        if (textContent) review.text_content = textContent;
        if (isAnonymous !== undefined) review.is_anonymous = isAnonymous;

        if (microRatings) {
            review.micro_ratings = microRatings;
            const ratings = Object.values(microRatings);
            review.overall_rating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        }

        review.is_edited = true;
        await review.save();

        // Update Business Aggregates
        await updateBusinessAggregates(review.business_id);

        return NextResponse.json({ success: true, review });
    } catch (error) {
        console.error('Error updating review:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
