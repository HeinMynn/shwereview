import mongoose from 'mongoose';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables manually
const envPath = join(__dirname, '../.env.local');
let MONGODB_URI;

try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const match = envFile.match(/MONGODB_URI=(.*)/);
    if (match && match[1]) {
        MONGODB_URI = match[1].trim().replace(/["']/g, '');
    }
} catch (error) {
    console.error('Error reading .env.local:', error);
}

if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
}

// Define Schemas inline
const ReviewSchema = new mongoose.Schema({}, { strict: false });
const BusinessSchema = new mongoose.Schema({}, { strict: false });

const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const Business = mongoose.models.Business || mongoose.model('Business', BusinessSchema);

async function clearReviews() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Delete all reviews
        const deleteResult = await Review.deleteMany({});
        console.log(`Deleted ${deleteResult.deletedCount} reviews.`);

        // 2. Reset Business Aggregates
        const updateResult = await Business.updateMany({}, {
            $set: {
                review_count: 0,
                aggregate_rating: 0,
                micro_metrics_aggregates: {},
                category_aggregates: {}
            }
        });
        console.log(`Reset aggregates for ${updateResult.modifiedCount} businesses.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

clearReviews();
