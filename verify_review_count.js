const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const envPath = path.resolve(process.cwd(), '.env.local');
let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            if (key === 'MONGODB_URI') {
                MONGODB_URI = value;
            }
        }
    });
}

// Define minimal schemas inline
const BusinessSchema = new mongoose.Schema({
    name: String,
    status: String,
    aggregate_rating: Number
}, { strict: false });

const ReviewSchema = new mongoose.Schema({
    business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
    text_content: String
}, { strict: false });

const Business = mongoose.models.Business || mongoose.model('Business', BusinessSchema);
const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

async function verifyReviewCount() {
    try {
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env.local');
        }
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Run the aggregation
        const businesses = await Business.aggregate([
            { $match: { status: 'approved' } },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'business_id',
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    review_count: { $size: '$reviews' }
                }
            },
            {
                $project: {
                    name: 1,
                    review_count: 1
                }
            },
            { $sort: { aggregate_rating: -1 } },
            { $limit: 5 }
        ]);

        console.log('Businesses with Review Counts:');
        if (businesses.length === 0) {
            console.log('No approved businesses found.');
        }

        for (const b of businesses) {
            console.log(`- ${b.name}: ${b.review_count}`);

            // Double check with a direct count
            const actualCount = await Review.countDocuments({ business_id: b._id });
            if (actualCount === b.review_count) {
                console.log(`  -> Verified! (Actual: ${actualCount})`);
            } else {
                console.error(`  -> MISMATCH! (Actual: ${actualCount})`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verifyReviewCount();
