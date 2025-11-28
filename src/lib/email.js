import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API Key
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
    console.warn('SENDGRID_API_KEY is missing in environment variables.');
}

export async function sendVerificationEmail(to, code, type = 'claim') {
    try {
        if (!process.env.SENDGRID_API_KEY) {
            console.error('SendGrid API Key is missing. Cannot send email.');
            return false;
        }

        console.log('Attempting to send email via SendGrid to:', to);

        let subject = 'Verify your Business Claim - ShweReview';
        let htmlContent = '';

        if (type === 'claim') {
            subject = 'Verify your Business Claim - ShweReview';
            htmlContent = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4F46E5;">ShweReview Business Verification</h2>
                    <p>You have requested to claim a business on ShweReview.</p>
                    <p>Please use the following code to verify your email address:</p>
                    <div style="background-color: #F3F4F6; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
                        ${code}
                    </div>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `;
        } else if (type === 'register') {
            subject = 'Verify your Account - ShweReview';
            htmlContent = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4F46E5;">Welcome to ShweReview!</h2>
                    <p>Thank you for registering. Please verify your email address to complete your account setup.</p>
                    <p>Your verification code is:</p>
                    <div style="background-color: #F3F4F6; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
                        ${code}
                    </div>
                    <p>This code will expire in 15 minutes.</p>
                    <p>If you did not create an account, please ignore this email.</p>
                </div>
            `;
        }

        const fromEmail = process.env.SMTP_FROM || 'noreply@shwereview.com';
        const fromName = process.env.SMTP_FROM_NAME || 'ShweReview';

        let fromAddress = fromEmail;

        // If SMTP_FROM is just an email (no name part), add the name
        if (!fromEmail.includes('<') && !fromEmail.includes('"')) {
            fromAddress = `"${fromName}" <${fromEmail}>`;
        }

        const msg = {
            to,
            from: fromAddress,
            subject,
            text: `Your verification code is: ${code}`,
            html: htmlContent,
        };

        await sgMail.send(msg);
        console.log('Email sent successfully to:', to);
        return true;
    } catch (error) {
        console.error('Error sending email via SendGrid:', error);
        if (error.response) {
            console.error('SendGrid Response Body:', error.response.body);
        }
        return false;
    }
}
