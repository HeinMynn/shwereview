import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Find businesses owned by the user or submitted by the user
        const businesses = await Business.find({
            owner_id: session.user.id
        }).select('name address subscription_tier subscription_status images aggregate_rating');

        return NextResponse.json({ businesses });

    } catch (error) {
        console.error('Error fetching user businesses:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
