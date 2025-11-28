import { NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const to = searchParams.get('to');
        const sendgridKey = process.env.SENDGRID_API_KEY;
        const smtpFrom = process.env.SMTP_FROM;

        const configStatus = {
            SENDGRID_API_KEY_PRESENT: !!sendgridKey,
            SMTP_FROM: smtpFrom || 'UNDEFINED (Using Fallback: noreply@shwereview.com)',
        };

        if (to) {
            console.log(`Sending test email to ${to} using from: ${smtpFrom}`);
            const sent = await sendVerificationEmail(to, 'TEST-123456', 'register');
            return NextResponse.json({
                message: sent ? 'Test email sent successfully' : 'Failed to send test email',
                sent,
                config: configStatus
            });
        }

        return NextResponse.json({
            message: 'Email Configuration Check (Add ?to=your@email.com to send a test email)',
            config: configStatus
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
