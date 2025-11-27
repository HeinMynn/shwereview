import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Notification } from '@/lib/models';

export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { id } = await params;

        // Find and update the notification
        const notification = await Notification.findOne({
            _id: id,
            user_id: session.user.id // Ensure user owns this notification
        });

        if (!notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        notification.is_read = true;
        await notification.save();

        return NextResponse.json({ success: true, notification });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
