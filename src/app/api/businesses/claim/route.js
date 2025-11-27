import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { businessId, method, data } = await request.json();

        if (!method) {
            return NextResponse.json({ error: 'Verification method is required' }, { status: 400 });
        }

        const business = await Business.findById(businessId);

        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        if (business.owner_id) {
            return NextResponse.json({ error: 'Business is already owned' }, { status: 400 });
        }

        if (business.claim_status === 'pending' && business.claimant_id?.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Claim already pending by another user' }, { status: 400 });
        }

        business.claim_status = 'pending';
        business.claimant_id = session.user.id;
        business.claim_verification_method = method;
        business.claim_verification_status = 'pending';

        let responseData = {};

        if (method === 'document') {
            if (!data) return NextResponse.json({ error: 'Proof URL is required' }, { status: 400 });
            business.claim_proof = data;
        } else if (method === 'dns') {
            // Generate a unique TXT record token if not already present
            let token = business.claim_verification_data;
            if (!token || !token.startsWith('shwereview-verification=')) {
                token = `shwereview-verification=${crypto.randomBytes(16).toString('hex')}`;
                business.claim_verification_data = token;
            }
            responseData = { token };
        } else if (method === 'email') {
            if (!data) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

            const code = Math.floor(100000 + Math.random() * 900000).toString();

            // Send real email
            const emailSent = await sendVerificationEmail(data, code);

            if (!emailSent) {
                return NextResponse.json({ error: 'Failed to send verification email. Please check your SMTP settings.' }, { status: 500 });
            }

            // Store code temporarily
            business.claim_verification_data = `${data}|${code}`;
            responseData = { message: 'Verification code sent to your email' };
        }

        await business.save();

        return NextResponse.json({ success: true, business, ...responseData });
    } catch (error) {
        console.error('Claim error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
