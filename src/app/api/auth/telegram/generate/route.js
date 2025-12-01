import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import { TelegramVerification } from '@/lib/models';
import crypto from 'crypto';

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();

        // Generate a unique token
        const token = crypto.randomBytes(16).toString('hex');

        // Create verification record
        await TelegramVerification.create({
            token,
            user_id: session.user.id
        });

        const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'YourBotName'; // Fallback for dev
        const botLink = `https://t.me/${botUsername}?start=${token}`;

        return NextResponse.json({
            success: true,
            link: botLink,
            token: token // Optional: return token if needed for polling/debug
        });

    } catch (error) {
        console.error('Telegram token generation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
