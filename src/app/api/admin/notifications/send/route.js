import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User, Notification } from '@/lib/models';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        // Authorization Check
        if (!session || session.user.role !== 'Super Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { recipientRole, userId, title, message, link } = body;

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and Message are required' }, { status: 400 });
        }

        let recipients = [];

        // Determine Recipients
        if (userId) {
            // Send to specific user
            const user = await User.findById(userId);
            if (user) recipients.push(user);
        } else if (recipientRole) {
            // Send to role group
            if (recipientRole === 'All Users') {
                recipients = await User.find({});
            } else if (recipientRole === 'Owner') {
                recipients = await User.find({ role: 'Owner' });
            } else if (recipientRole === 'User') {
                recipients = await User.find({ role: 'User' });
            }
        } else {
            return NextResponse.json({ error: 'Recipient not specified' }, { status: 400 });
        }

        if (recipients.length === 0) {
            return NextResponse.json({ error: 'No recipients found' }, { status: 404 });
        }

        // Create Notifications in Bulk
        const notifications = recipients.map(user => ({
            user_id: user._id,
            type: 'other', // Generic type for admin messages
            title,
            message,
            link,
            is_read: false,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        await Notification.insertMany(notifications);

        return NextResponse.json({
            success: true,
            count: notifications.length,
            message: `Successfully sent to ${notifications.length} users`
        });

    } catch (error) {
        console.error('Error sending notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
