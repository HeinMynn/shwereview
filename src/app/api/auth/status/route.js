import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import { User, TelegramVerification } from '@/lib/models';

export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ verified: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const user = await User.findById(session.user.id).select('phone_verified');

        if (user?.phone_verified) {
            return NextResponse.json({ verified: true });
        }

        // Check for failed verification attempt
        const verification = await TelegramVerification.findOne({ user_id: session.user.id })
            .sort({ createdAt: -1 });

        if (verification && verification.status === 'failed') {
            return NextResponse.json({ verified: false, error: 'duplicate_phone' });
        }

        return NextResponse.json({ verified: false });
    } catch (error) {
        console.error('Status check error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
