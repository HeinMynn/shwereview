import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request) {
    try {
        await dbConnect();
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // Return success even if user not found to prevent enumeration
            return NextResponse.json({ success: true, message: 'If an account exists, a code has been sent.' });
        }

        if (user.email_verified) {
            return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
        }

        // Rate Limiting Check
        if (user.last_verification_sent_at) {
            const timeSinceLastSent = Date.now() - new Date(user.last_verification_sent_at).getTime();
            if (timeSinceLastSent < 3 * 60 * 1000) { // 3 minutes
                const remainingSeconds = Math.ceil((3 * 60 * 1000 - timeSinceLastSent) / 1000);
                return NextResponse.json({ error: `Please wait ${remainingSeconds} seconds before requesting a new code.` }, { status: 429 });
            }
        }

        // Generate new code securely
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        const verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        user.verification_token = verificationCode;
        user.verification_token_expires = verificationTokenExpires;
        user.last_verification_sent_at = new Date();
        await user.save();

        // Send verification email
        const emailResult = await sendVerificationEmail(email, verificationCode, 'register');

        if (!emailResult.success) {
            console.error('Failed to resend verification email:', emailResult.error);
            return NextResponse.json({ error: 'Failed to send email. Please try again later.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Verification code sent' });
    } catch (error) {
        console.error('Resend error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
