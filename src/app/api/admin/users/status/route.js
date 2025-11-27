import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'Super Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, status, action } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        await dbConnect();

        let updateData = {};

        if (action === 'warn') {
            updateData = {
                $inc: { warning_count: 1 },
                account_status: 'warning'
            };
        } else if (action === 'reset_warnings') {
            updateData = {
                warning_count: 0
            };
        } else if (status) {
            updateData = { account_status: status };
        } else {
            return NextResponse.json({ error: 'Invalid action or status' }, { status: 400 });
        }

        console.log('Update Data:', updateData);
        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );
        console.log('Updated User:', user);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Error updating user status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
