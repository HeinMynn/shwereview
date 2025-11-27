import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Super Admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { businessId, isVerified } = await request.json();

        const business = await Business.findByIdAndUpdate(
            businessId,
            { is_verified: isVerified },
            { new: true }
        );

        return NextResponse.json({ success: true, business });
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
