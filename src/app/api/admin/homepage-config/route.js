import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import { HomepageConfig } from '@/lib/models';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'Super Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const data = await req.json();

        // Upsert the configuration (always keep one active config or update the latest)
        // For simplicity, we can just create a new one or update the existing one.
        // Let's update the most recent one or create if none.

        let config = await HomepageConfig.findOne().sort({ createdAt: -1 });

        if (config) {
            config = await HomepageConfig.findByIdAndUpdate(config._id, data, { new: true });
        } else {
            config = await HomepageConfig.create(data);
        }

        return NextResponse.json({ success: true, config });
    } catch (error) {
        console.error('Update homepage config error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
