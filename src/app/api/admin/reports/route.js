import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Report, Review, User, Notification } from '@/lib/models';
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
        const { reportId, status, decisionReason } = body;

        if (!reportId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const report = await Report.findByIdAndUpdate(
            reportId,
            { status },
            { new: true }
        ).populate('reporter_id').populate({
            path: 'review_id',
            populate: { path: 'user_id' }
        });

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // Notify Reporter
        let reporterMessage = '';
        if (status === 'resolved') {
            reporterMessage = decisionReason || 'We have reviewed your report and taken action. Thank you for helping keep our community safe.';
        } else if (status === 'dismissed') {
            reporterMessage = decisionReason || 'We have reviewed your report and found that the content does not violate our policies at this time.';
        }

        if (status !== 'pending') {
            await Notification.create({
                user_id: report.reporter_id._id,
                type: 'report_result',
                title: 'Report Update',
                message: reporterMessage,
                link: `/business/${report.review_id.business_id}`, // Link to business where review was
                metadata: { report_id: report._id, status: status }
            });
        }

        // If report is resolved, hide the review and notify the review owner
        if (status === 'resolved') {
            await Review.findByIdAndUpdate(report.review_id._id, { is_hidden: true });

            // Notify Review Owner
            const reviewOwnerMessage = decisionReason
                ? `Your review was removed because: ${decisionReason}`
                : 'Your review was removed because it was found to violate our Community Guidelines.';

            await Notification.create({
                user_id: report.review_id.user_id._id,
                type: 'review_removed',
                title: 'Review Removed',
                message: reviewOwnerMessage,
                link: `/community-guidelines`, // Link to guidelines
                metadata: { review_id: report.review_id._id, report_id: report._id }
            });
        }

        return NextResponse.json({ success: true, report });
    } catch (error) {
        console.error('Error updating report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
