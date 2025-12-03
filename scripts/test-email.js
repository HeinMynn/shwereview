const fs = require('fs');
const path = require('path');
const sgMail = require('@sendgrid/mail');

async function testEmail() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('.env.local file not found!');
            return;
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                let value = valueParts.join('=').trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                envVars[key.trim()] = value;
            }
        });

        const apiKey = envVars['SENDGRID_API_KEY'];
        const fromEmail = envVars['SMTP_FROM'] || 'noreply@shwereview.com';

        if (!apiKey) {
            console.error('SENDGRID_API_KEY not found in .env.local');
            return;
        }

        console.log('Found API Key:', apiKey.substring(0, 5) + '...');
        console.log('From Email:', fromEmail);

        sgMail.setApiKey(apiKey);

        const msg = {
            to: 'test@example.com',
            from: fromEmail,
            subject: 'Test Email from ShweReview Debugger',
            text: 'This is a test email to verify SendGrid configuration.',
        };

        console.log('Attempting to send email...');
        await sgMail.send(msg);
        console.log('Email sent successfully!');

    } catch (error) {
        console.error('Error sending email:');
        console.error(error.toString());
        if (error.response) {
            console.error('Response body:', JSON.stringify(error.response.body, null, 2));
        }
    }
}

testEmail();
