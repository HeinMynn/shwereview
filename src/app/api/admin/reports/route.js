import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Report, Review, User } from '@/lib/models';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'Super Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const reports = await Report.find()
            .populate('reporter_id', 'name email')
            .populate({
                path: 'review_id',
                populate: { path: 'user_id', select: 'name email' }
            })
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, reports });
    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'Super Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { reportId, status } = body;

        if (!reportId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const report = await Report.findByIdAndUpdate(
            reportId,
            { status },
            { new: true }
        );

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // If report is resolved, hide the review
        if (status === 'resolved') {
            await Review.findByIdAndUpdate(report.review_id, { is_hidden: true });
        }

        return NextResponse.json({ success: true, report });
    } catch (error) {
        console.error('Error updating report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
