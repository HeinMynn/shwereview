import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request) {
    try {
        await dbConnect();
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        const user = await User.create({
            name,
            email,
            password_hash: passwordHash,
            role: 'User', // Default role
            email_verified: false,
            verification_token: verificationCode,
            verification_token_expires: verificationTokenExpires,
        });

        // Send verification email
        const emailSent = await sendVerificationEmail(email, verificationCode, 'register');

        if (!emailSent) {
            // Optionally delete the user if email fails, or just let them retry
            // For now, we'll return success but warn about email
            console.error('Failed to send registration email to:', email);
        }

        return NextResponse.json({ success: true, userId: user._id });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
