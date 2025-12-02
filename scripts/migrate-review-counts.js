const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
let MONGODB_URI;
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    const match = envFile.match(/MONGODB_URI=(.*)/);
    if (match && match[1]) {
        MONGODB_URI = match[1].trim();
    }
} catch (err) {
    console.log('Could not read .env.local, checking process.env');
    MONGODB_URI = process.env.MONGODB_URI;
}

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

// Define Schemas (simplified for migration)
const BusinessSchema = new mongoose.Schema({
    review_count: { type: Number, default: 0 }
});

const ReviewSchema = new mongoose.Schema({
    business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
    is_hidden: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false }
});

const Business = mongoose.models.Business || mongoose.model('Business', BusinessSchema);
const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

async function migrate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const businesses = await Business.find({});
        console.log(`Found ${businesses.length} businesses to update.`);

        let updatedCount = 0;

        for (const business of businesses) {
            const count = await Review.countDocuments({
                business_id: business._id,
                is_hidden: false,
                is_deleted: false
            });

            if (business.review_count !== count) {
                business.review_count = count;
                await business.save();
                updatedCount++;
                process.stdout.write(`\rUpdated: ${updatedCount}/${businesses.length}`);
            }
        }

        console.log('\nMigration complete!');
        console.log(`Updated ${updatedCount} businesses.`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

migrate();
