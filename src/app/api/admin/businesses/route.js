import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Super Admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const businesses = await Business.find({})
            .populate('owner_id', 'name email')
            .populate('claimant_id', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, businesses });
    } catch (error) {
        console.error('Error fetching businesses:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
