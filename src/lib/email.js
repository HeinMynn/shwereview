import nodemailer from 'nodemailer';

const port = parseInt(process.env.SMTP_PORT || '587');
const secure = process.env.SMTP_SECURE === 'true' || port === 465;

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: secure, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendVerificationEmail(to, code) {
    try {
        console.log('Attempting to send email with config:', {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS ? '****' : 'MISSING'
        });

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"ShweReview" <noreply@shwereview.com>',
            to,
            subject: 'Verify your Business Claim - ShweReview',
            text: `Your verification code is: ${code}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4F46E5;">ShweReview Business Verification</h2>
                    <p>You have requested to claim a business on ShweReview.</p>
                    <p>Please use the following code to verify your email address:</p>
                    <div style="background-color: #F3F4F6; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
                        ${code}
                    </div>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `,
        });
        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        if (error.response) console.error('SMTP Response:', error.response);
        return false;
    }
}
