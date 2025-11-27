import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Notification } from '@/lib/models';

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();

        // Mark all user's notifications as read
        await Notification.updateMany(
            { user_id: session.user.id, is_read: false },
            { is_read: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
