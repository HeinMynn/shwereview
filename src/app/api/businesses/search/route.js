import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ businesses: [] });
        }

        // Case-insensitive search
        const businesses = await Business.find({
            name: { $regex: query, $options: 'i' },
            status: 'approved' // Only show approved businesses
        })
            .select('_id name address images category is_verified owner_id claim_status')
            .limit(5)
            .lean();

        return NextResponse.json({ businesses });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
