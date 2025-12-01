import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { TelegramVerification, User } from '@/lib/models';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId, text, options = {}) {
    console.log(`Attempting to send message to ${chatId}: ${text}`);
    if (!TELEGRAM_BOT_TOKEN) {
        console.error('TELEGRAM_BOT_TOKEN is missing in environment variables!');
        return;
    }
    try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                ...options
            })
        });
        const data = await res.json();
        console.log('Telegram API Response:', JSON.stringify(data));
    } catch (error) {
        console.error('Failed to send Telegram message:', error);
    }
}

export async function GET(request) {
    console.log('GET request received at webhook endpoint');
    return NextResponse.json({ status: 'Webhook Active', message: 'Send POST requests here from Telegram' });
}

export async function POST(request) {
    try {
        const update = await request.json();
        console.log('Telegram Webhook Received:', JSON.stringify(update, null, 2));

        if (!TELEGRAM_BOT_TOKEN) {
            console.error('CRITICAL: TELEGRAM_BOT_TOKEN is not set!');
        }

        // Handle /start <token>
        if (update.message && update.message.text && update.message.text.startsWith('/start ')) {
            const token = update.message.text.split(' ')[1];
            const chatId = update.message.chat.id;
            console.log(`Processing /start with token: ${token} for chat: ${chatId}`);

            await dbConnect();
            console.log('Database connected');

            const verification = await TelegramVerification.findOne({ token });
            console.log('Verification record found:', !!verification);

            if (verification) {
                // Update verification with chat_id
                verification.chat_id = chatId;
                await verification.save();
                console.log('Verification record updated with chat_id');

                // Request contact
                await sendTelegramMessage(chatId, 'Please share your contact to verify your phone number.', {
                    reply_markup: {
                        keyboard: [[{
                            text: "Share Contact",
                            request_contact: true
                        }]],
                        one_time_keyboard: true,
                        resize_keyboard: true
                    }
                });
            } else {
                console.warn('Invalid token received');
                await sendTelegramMessage(chatId, 'Invalid or expired verification link. Please try again from the website.');
            }
        }

        // Handle Contact Sharing
        if (update.message && update.message.contact) {
            const contact = update.message.contact;
            const chatId = update.message.chat.id;
            console.log('Received contact:', JSON.stringify(contact));

            await dbConnect();
            // Find verification by chat_id (assuming user clicked start first)
            // Or we could rely on the user sending contact immediately if we didn't store chat_id yet, 
            // but the flow is Start -> Share.
            // Let's find the most recent verification for this chat_id
            const verification = await TelegramVerification.findOne({ chat_id: chatId }).sort({ createdAt: -1 });
            console.log('Verification record for contact found:', !!verification);

            if (verification) {
                const phoneNumber = contact.phone_number.startsWith('+') ? contact.phone_number : `+${contact.phone_number}`;

                // Check if phone number is already used by another user
                const existingUser = await User.findOne({ phone: phoneNumber });

                if (existingUser && existingUser._id.toString() !== verification.user_id.toString()) {
                    console.warn(`Phone number ${phoneNumber} is already in use by user ${existingUser._id}`);
                    await sendTelegramMessage(chatId, 'This phone number is already registered to another account. Please use a different Telegram account. You need to start the verification process again from the website.', {
                        reply_markup: { remove_keyboard: true }
                    });
                    return NextResponse.json({ ok: true });
                }

                // Update User
                await User.findByIdAndUpdate(verification.user_id, {
                    phone: phoneNumber,
                    phone_verified: true
                });
                console.log(`User ${verification.user_id} verified with phone ${phoneNumber}`);

                // Delete verification record
                await TelegramVerification.findByIdAndDelete(verification._id);

                await sendTelegramMessage(chatId, 'Phone number verified successfully! You can now return to the website.', {
                    reply_markup: { remove_keyboard: true }
                });
            } else {
                console.warn('No pending verification for this contact share');
                await sendTelegramMessage(chatId, 'No pending verification found. Please start from the website.', {
                    reply_markup: { remove_keyboard: true }
                });
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Telegram webhook error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
