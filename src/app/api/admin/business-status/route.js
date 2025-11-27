import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Super Admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const body = await request.json();
        console.log('Admin Status Update Request Body:', body);
        const { businessId, status } = body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            console.error('Invalid status:', status);
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const business = await Business.findByIdAndUpdate(
            businessId,
            { status },
            { new: true }
        );

        if (!business) {
            console.error('Business not found for ID:', businessId);
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        console.log('Business updated successfully:', business);
        return NextResponse.json({ success: true, business });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
