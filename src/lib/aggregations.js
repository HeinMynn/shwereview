import { Review, Business } from '@/lib/models';

export async function updateBusinessAggregates(businessId) {
    const business = await Business.findById(businessId);
    if (!business) return;

    // Exclude hidden reviews from the aggregation
    const allReviews = await Review.find({ business_id: businessId, is_hidden: false });

    if (allReviews.length === 0) {
        business.aggregate_rating = 0;
        business.micro_metrics_aggregates = {};
        await business.save();
        return;
    }

    const totalOverall = allReviews.reduce((sum, r) => sum + r.overall_rating, 0);
    const newAggregateRating = totalOverall / allReviews.length;

    const microAggregates = {};
    const counts = {};

    allReviews.forEach(r => {
        const mRatings = r.micro_ratings instanceof Map ? Object.fromEntries(r.micro_ratings) : r.micro_ratings;

        for (const [key, value] of Object.entries(mRatings)) {
            if (!microAggregates[key]) {
                microAggregates[key] = 0;
                counts[key] = 0;
            }
            microAggregates[key] += value;
            counts[key]++;
        }
    });

    for (const key in microAggregates) {
        microAggregates[key] = microAggregates[key] / counts[key];
    }

    business.aggregate_rating = newAggregateRating;
    business.micro_metrics_aggregates = microAggregates;
    await business.save();
}
