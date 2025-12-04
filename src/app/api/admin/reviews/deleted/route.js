import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Review } from '@/lib/models';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'Super Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const businessId = searchParams.get('businessId');

        const query = { is_deleted: true };
        if (userId) query.user_id = userId;
        if (businessId) query.business_id = businessId;

        const reviews = await Review.find(query)
            .populate('user_id', 'name email')
            .populate('business_id', 'name')
            .sort({ deletedAt: -1, updatedAt: -1 })
            .lean();

        return NextResponse.json({ reviews });
    } catch (error) {
        console.error('Error fetching deleted reviews:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
