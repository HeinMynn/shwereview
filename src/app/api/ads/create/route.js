import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';
import crypto from 'crypto';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { businessId, durationDays, amount } = body;

        if (!businessId || !durationDays || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        // Verify ownership
        const business = await Business.findOne({ _id: businessId, owner_id: session.user.id });
        if (!business) {
            return NextResponse.json({ error: 'Business not found or unauthorized' }, { status: 404 });
        }

        // Mock Payment Processing
        // In a real app, we would verify the payment intent from Stripe here
        const transactionId = `tx_${crypto.randomBytes(12).toString('hex')}`;

        // Calculate new end date
        const now = new Date();
        let newPromotedUntil = new Date();

        // If already promoted and active, extend from the current end date
        if (business.promoted_until && new Date(business.promoted_until) > now) {
            newPromotedUntil = new Date(business.promoted_until);
        }

        newPromotedUntil.setDate(newPromotedUntil.getDate() + parseInt(durationDays));

        // Update Business
        business.promoted_until = newPromotedUntil;
        business.ad_campaigns.push({
            start_date: now,
            end_date: newPromotedUntil,
            amount_paid: amount,
            transaction_id: transactionId
        });

        await business.save();

        return NextResponse.json({
            success: true,
            promoted_until: newPromotedUntil,
            message: `Successfully promoted for ${durationDays} days!`
        });

    } catch (error) {
        console.error('Ad creation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
