import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { TelegramVerification, User } from '@/lib/models';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId, text, options = {}) {
    if (!TELEGRAM_BOT_TOKEN) return;
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                ...options
            })
        });
    } catch (error) {
        console.error('Failed to send Telegram message:', error);
    }
}

export async function POST(request) {
    try {
        const update = await request.json();

        // Handle /start <token>
        if (update.message && update.message.text && update.message.text.startsWith('/start ')) {
            const token = update.message.text.split(' ')[1];
            const chatId = update.message.chat.id;

            await dbConnect();
            const verification = await TelegramVerification.findOne({ token });

            if (verification) {
                // Update verification with chat_id
                verification.chat_id = chatId;
                await verification.save();

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
                await sendTelegramMessage(chatId, 'Invalid or expired verification link. Please try again from the website.');
            }
        }

        // Handle Contact Sharing
        if (update.message && update.message.contact) {
            const contact = update.message.contact;
            const chatId = update.message.chat.id;

            await dbConnect();
            // Find verification by chat_id (assuming user clicked start first)
            // Or we could rely on the user sending contact immediately if we didn't store chat_id yet, 
            // but the flow is Start -> Share.
            // Let's find the most recent verification for this chat_id
            const verification = await TelegramVerification.findOne({ chat_id: chatId }).sort({ createdAt: -1 });

            if (verification) {
                const phoneNumber = contact.phone_number.startsWith('+') ? contact.phone_number : `+${contact.phone_number}`;

                // Update User
                await User.findByIdAndUpdate(verification.user_id, {
                    phone: phoneNumber,
                    phone_verified: true
                });

                // Delete verification record
                await TelegramVerification.findByIdAndDelete(verification._id);

                await sendTelegramMessage(chatId, 'Phone number verified successfully! You can now return to the website.', {
                    reply_markup: { remove_keyboard: true }
                });
            } else {
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
