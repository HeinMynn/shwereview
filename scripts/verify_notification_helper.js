
import dbConnect from '../src/lib/mongodb.js';
import { User, Notification } from '../src/lib/models.js';
import { createNotification } from '../src/lib/notifications.js';
import mongoose from 'mongoose';
// dotenv removed, using node --env-file


async function verifyNotification() {
    try {
        console.log('Connecting to DB...');
        await dbConnect();

        console.log('Finding or creating test user...');
        let user = await User.findOne({ email: 'test_notification_user@example.com' });
        if (!user) {
            user = await User.create({
                name: 'Test Notification User',
                email: 'test_notification_user@example.com',
                password_hash: 'dummy',
                role: 'User'
            });
            console.log('Created test user:', user._id);
        } else {
            console.log('Found test user:', user._id);
        }

        console.log('Testing createNotification helper...');
        const result = await createNotification({
            userId: user._id,
            type: 'test_type',
            title: 'Test Notification',
            message: 'This is a test notification',
            link: '/test',
            metadata: { test: true }
        });

        if (result.success) {
            console.log('Notification created successfully:', result.notification._id);
        } else {
            console.error('Failed to create notification:', result.error);
            process.exit(1);
        }

        console.log('Verifying in DB...');
        const dbNoti = await Notification.findById(result.notification._id);
        if (dbNoti && dbNoti.title === 'Test Notification') {
            console.log('Verification SUCCESS: Notification found in DB.');
        } else {
            console.error('Verification FAILED: Notification not found or incorrect.');
            process.exit(1);
        }

        // Cleanup
        await Notification.deleteOne({ _id: dbNoti._id });
        await User.deleteOne({ _id: user._id });
        console.log('Cleanup done.');

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verifyNotification();
