
import { Notification } from './models.js';
import dbConnect from './mongodb.js';

/**
 * Creates a notification for a user.
 * @param {Object} params
 * @param {string} params.userId - The ID of the user to receive the notification.
 * @param {string} params.type - The type of notification (e.g., 'claim_approved', 'claim_rejected', 'business_approved', 'business_rejected', 'other').
 * @param {string} params.title - The title of the notification.
 * @param {string} params.message - The message content.
 * @param {string} [params.link] - Optional link to redirect to.
 * @param {Object} [params.metadata] - Optional metadata (e.g., business_id).
 * @returns {Promise<Object>} The created notification object.
 */
export async function createNotification({ userId, type, title, message, link, metadata }) {
    try {
        await dbConnect();

        const notification = await Notification.create({
            user_id: userId,
            type,
            title,
            message,
            link,
            metadata,
            is_read: false,
        });

        return { success: true, notification };
    } catch (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
    }
}
