import { Review, Business } from '@/lib/models';

export async function updateBusinessAggregates(businessId) {
    const business = await Business.findById(businessId);
    if (!business) return;

    const result = await Review.aggregate([
        { $match: { business_id: business._id, is_hidden: false } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$overall_rating" },
                microRatings: { $push: "$micro_ratings" }
            }
        }
    ]);

    if (result.length === 0) {
        business.aggregate_rating = 0;
        business.micro_metrics_aggregates = {};
        await business.save();
        return;
    }

    const { averageRating, microRatings } = result[0];

    // Calculate micro-metrics averages
    // Since micro_ratings are stored as Maps/Objects in documents, we still need some processing
    // but we've reduced the data transfer significantly by only fetching what we need.
    // Ideally, micro_ratings should be flattened in the schema for pure DB aggregation,
    // but for now, we'll process the array of maps.

    const microAggregates = {};
    const counts = {};

    microRatings.forEach(mRatings => {
        // Handle both Map and Object structures
        const ratingsObj = mRatings instanceof Map ? Object.fromEntries(mRatings) : mRatings;

        for (const [key, value] of Object.entries(ratingsObj)) {
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

    business.aggregate_rating = averageRating;
    business.micro_metrics_aggregates = microAggregates;
    await business.save();
}
