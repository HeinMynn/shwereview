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

        // Escape special characters for regex
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Case-insensitive search
        let businesses = await Business.find({
            name: { $regex: escapedQuery, $options: 'i' },
            status: 'approved' // Only show approved businesses
        })
            .select('_id name address images category is_verified owner_id claim_status promoted_until')
            .limit(10) // Fetch slightly more to ensure we catch promoted ones
            .lean();

        // Sort: Active Promoted > Others
        const now = new Date();
        businesses.sort((a, b) => {
            const isAPromoted = a.promoted_until && new Date(a.promoted_until) > now;
            const isBPromoted = b.promoted_until && new Date(b.promoted_until) > now;

            if (isAPromoted && !isBPromoted) return -1;
            if (!isAPromoted && isBPromoted) return 1;
            return 0; // Keep original order (relevance/name)
        });

        // Limit back to 5
        businesses = businesses.slice(0, 5);

        return NextResponse.json({ businesses });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
