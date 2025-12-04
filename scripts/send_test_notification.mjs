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
        MONGODB_URI = match[1].trim().replace(/["']/g, ''); // Remove quotes if present
    }
} catch (error) {
    console.error('Error reading .env.local:', error);
}

if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
}

// Define Schema inline to avoid import issues with Next.js specific code in models.js
const NotificationSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['claim_approved', 'claim_rejected', 'claim_pending', 'report_result', 'review_removed', 'other'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    is_read: { type: Boolean, default: false },
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['Super Admin', 'Owner', 'User'], default: 'User' },
}, { timestamps: true });

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function sendTestNotifications() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find a Super Admin
        const admin = await User.findOne({ role: 'Super Admin' });
        if (!admin) {
            console.error('No Super Admin found');
            process.exit(1);
        }

        console.log(`Sending notifications to ${admin.name} (${admin.email})...`);

        const businessName = "Test Business";
        const businessLink = "/business/test-id";
        const decisionReason = "it contained hate speech";

        // 1. Report Result Notification (To Reporter)
        await Notification.create({
            user_id: admin._id,
            type: 'report_result',
            title: 'Report Resolved',
            message: `We would like to inform you that we have reviewed the content you reported regarding ${businessName}. We have determined that it violates our Community Guidelines and have taken appropriate action to remove it. Thank you for your vigilance in helping keep our community safe.`,
            link: businessLink,
            metadata: { status: 'resolved' }
        });
        console.log('Sent "Report Resolved" notification.');

        // 2. Review Removed Notification (To Review Owner)
        const reasonText = ` specifically regarding: ${decisionReason}`;
        await Notification.create({
            user_id: admin._id,
            type: 'review_removed',
            title: 'Review Removed',
            message: `We are writing to inform you that your review for ${businessName} has been removed. This action was taken because the content was found to be in violation of our Community Guidelines${reasonText}. Please review our guidelines to ensure future contributions adhere to our standards.\n\n[Community Guidelines](/community-guidelines)`,
            link: businessLink,
            metadata: { status: 'removed' }
        });
        console.log('Sent "Review Removed" notification.');

        console.log('Done!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

sendTestNotifications();
