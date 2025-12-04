import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';

export async function GET() {
    try {
        await dbConnect();
        const businesses = await Business.find({}).select('name country status').limit(20);

        const debugData = businesses.map(b => ({
            id: b._id,
            name: b.name,
            country: b.country,
            status: b.status
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
