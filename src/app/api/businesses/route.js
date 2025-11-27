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
        const { name, description, address, category } = body;

        // Validate required fields
        if (!name || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const business = await Business.create({
            name,
            description,
            address,
            category,
            owner_id: null, // Unclaimed initially
            submitted_by: session.user.id,
            status: 'pending',
            claim_status: 'unclaimed',
            is_verified: false,
            images: [`https://placehold.co/600x400/gray/white?text=${encodeURIComponent(name)}`],
        });

        return NextResponse.json({ success: true, business });
    } catch (error) {
        console.error('Error creating business:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
