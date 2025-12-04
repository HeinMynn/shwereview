import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Category } from '@/lib/models';

export async function GET() {
    try {
        await dbConnect();
        const categories = await Category.find({}).sort({ order: 1, name: 1 });
        return NextResponse.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
