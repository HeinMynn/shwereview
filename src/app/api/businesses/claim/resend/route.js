import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business, BusinessClaim } from '@/lib/models';
import { sendVerificationEmail } from '@/lib/email';

import crypto from 'crypto';

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { businessId, email } = await request.json();

        if (!businessId || !email) {
            return NextResponse.json({ error: 'Business ID and Email are required' }, { status: 400 });
        }

        const business = await Business.findById(businessId);

        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        // Find the specific claim for this user
        const claim = await BusinessClaim.findOne({
            business_id: businessId,
            claimant_id: session.user.id,
            status: 'pending'
        });

        if (!claim) {
            return NextResponse.json({ error: 'No pending claim found for this user' }, { status: 400 });
        }

        if (claim.email !== email) {
            return NextResponse.json({ error: 'Email does not match the initial claim request' }, { status: 400 });
        }

        // Rate Limiting Check
        if (claim.last_sent_at) {
            const timeSinceLastSent = Date.now() - new Date(claim.last_sent_at).getTime();
            if (timeSinceLastSent < 3 * 60 * 1000) { // 3 minutes
                const remainingSeconds = Math.ceil((3 * 60 * 1000 - timeSinceLastSent) / 1000);
                return NextResponse.json({ error: `Please wait ${remainingSeconds} seconds before requesting a new code.` }, { status: 429 });
            }
        }

        // Generate new code securely
        const code = crypto.randomInt(100000, 999999).toString();

        // Send real email
        const emailResult = await sendVerificationEmail(email, code);

        if (!emailResult.success) {
            console.error(`Failed to resend claim verification email: ${emailResult.error}`);
            return NextResponse.json({ error: 'Failed to send verification email. Please try again later.' }, { status: 500 });
        }

        // Update verification data
        claim.verification_data = `${email}|${code}`;
        claim.last_sent_at = new Date();
        await claim.save();

        return NextResponse.json({ success: true, message: 'Verification code resent' });
    } catch (error) {
        console.error('Resend claim error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
