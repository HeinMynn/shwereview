import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';

export async function GET() {
    try {
        await dbConnect();
        const businesses = await Business.find({});

        const debugData = businesses.map(b => ({
            id: b._id,
            name: b.name,
            category: b.category,
            subcategory: b.subcategory,
            status: b.status,
            tags: b.tags
        }));

        return NextResponse.json({ count: businesses.length, businesses: debugData });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        await dbConnect();
        const result = await Business.updateMany({}, { status: 'approved' });
        return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
