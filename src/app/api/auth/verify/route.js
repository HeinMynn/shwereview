import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';

export async function POST(request) {
    try {
        await dbConnect();
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.email_verified) {
            return NextResponse.json({ message: 'Email already verified' });
        }

        if (user.verification_token !== code) {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
        }

        if (new Date() > user.verification_token_expires) {
            return NextResponse.json({ error: 'Verification code expired' }, { status: 400 });
        }

        user.email_verified = true;
        user.verification_token = undefined;
        user.verification_token_expires = undefined;
        await user.save();

        return NextResponse.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
