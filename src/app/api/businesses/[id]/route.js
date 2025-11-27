import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Business, Review } from '@/lib/models';

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const business = await Business.findById(id).populate('owner_id', 'name email');

        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const reviews = await Review.find({ business_id: id })
            .populate('user_id', 'name avatar badges')
            .sort({ createdAt: -1 });

        return NextResponse.json({ business, reviews });
    } catch (error) {
        console.error('Error fetching business:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
