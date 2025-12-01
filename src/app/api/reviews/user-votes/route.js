import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import { ReviewVote } from '@/lib/models';

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ votes: {} });
    }

    try {
        await dbConnect();
        const { reviewIds } = await request.json();

        if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
            return NextResponse.json({ votes: {} });
        }

        const votes = await ReviewVote.find({
            user_id: session.user.id,
            review_id: { $in: reviewIds }
        });

        const votesMap = {};
        votes.forEach(vote => {
            votesMap[vote.review_id.toString()] = vote.vote_type;
        });

        return NextResponse.json({ votes: votesMap });

    } catch (error) {
        console.error('Fetch votes error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
