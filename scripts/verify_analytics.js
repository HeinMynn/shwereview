
import dbConnect from '../src/lib/mongodb.js';
import { Business, BusinessMetric } from '../src/lib/models.js';
import mongoose from 'mongoose';

async function verifyAnalytics() {
    try {
        console.log('Connecting to DB...');
        await dbConnect();

        const businessId = new mongoose.Types.ObjectId();
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        console.log('Test Business ID:', businessId);
        console.log('Test Date (UTC midnight):', today);

        // 1. Simulate API Logic directly (since we can't easily curl local API in this script environment without server running)
        // We will test the DB logic which is the core of the API route.

        console.log('Simulating 1 View...');
        await BusinessMetric.findOneAndUpdate(
            { business_id: businessId, date: today },
            { $inc: { views: 1 } },
            { upsert: true }
        );

        console.log('Simulating 2 Website Clicks...');
        await BusinessMetric.findOneAndUpdate(
            { business_id: businessId, date: today },
            { $inc: { clicks_website: 1 } },
            { upsert: true }
        );
        await BusinessMetric.findOneAndUpdate(
            { business_id: businessId, date: today },
            { $inc: { clicks_website: 1 } },
            { upsert: true }
        );

        // 2. Verify Data
        const metric = await BusinessMetric.findOne({ business_id: businessId, date: today });
        console.log('Retrieved Metric:', metric);

        if (metric.views === 1 && metric.clicks_website === 2) {
            console.log('SUCCESS: Analytics aggregation working correctly.');
        } else {
            console.error('FAILURE: Counts do not match expected values.');
            process.exit(1);
        }

        // Cleanup
        await BusinessMetric.deleteOne({ _id: metric._id });
        console.log('Cleanup done.');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

verifyAnalytics();
