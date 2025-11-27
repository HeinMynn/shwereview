const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

let MONGODB_URI;
try {
    const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
    const match = envFile.match(/MONGODB_URI=(.*)/);
    if (match) MONGODB_URI = match[1].trim();
} catch (e) {
    console.log('Could not read .env.local');
}

const ReviewSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    text_content: { type: String, required: true },
    overall_rating: { type: Number, required: true },
    is_edited: { type: Boolean, default: false },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
});

const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function debugReviews() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        const reviews = await Review.find({});

        console.log(`Total Users: ${users.length}`);
        console.log(`Total Reviews: ${reviews.length}`);

        reviews.forEach(r => {
            const user = users.find(u => u._id.toString() === r.user_id.toString());
            console.log(`Review ${r._id}: Created by ${user ? user.name : 'UNKNOWN'} (ID: ${r.user_id})`);
        });

        const superAdmin = users.find(u => u.name === 'Super Admin');
        if (superAdmin) {
            const adminReviews = reviews.filter(r => r.user_id.toString() === superAdmin._id.toString());
            console.log(`\nSuper Admin (${superAdmin._id}) has ${adminReviews.length} reviews.`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugReviews();
