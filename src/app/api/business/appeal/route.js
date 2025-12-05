import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const body = await request.json();
        const { businessId, appealMessage } = body;

        if (!businessId || !appealMessage) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const business = await Business.findById(businessId);

        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        // Verify ownership (submitter or owner)
        const isOwner = business.owner_id?.toString() === session.user.id;
        const isSubmitter = business.submitted_by?.toString() === session.user.id;

        if (!isOwner && !isSubmitter && session.user.role !== 'Super Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Update business status and appeal message
        business.status = 'pending';
        business.appeal_message = appealMessage;
        // We keep the previous rejection_reason for context, or we could clear it. 
        // Keeping it seems better for the admin to see the history.

        await business.save();

        return NextResponse.json({ success: true, business });
    } catch (error) {
        console.error('Appeal error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
