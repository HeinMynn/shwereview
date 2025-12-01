import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';

export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ verified: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const user = await User.findById(session.user.id).select('phone_verified');

        return NextResponse.json({
            verified: user?.phone_verified || false
        });
    } catch (error) {
        console.error('Status check error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
