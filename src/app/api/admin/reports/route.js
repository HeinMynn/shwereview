import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Report, Review, User, Notification } from '@/lib/models';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { updateBusinessAggregates } from '@/lib/aggregations';

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
            populate: [
                { path: 'user_id' },
                { path: 'business_id', select: 'name' }
            ]
        });

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        const businessName = report.review_id?.business_id?.name || 'the business';
        const businessLink = `/business/${report.review_id?.business_id?._id}`;

        // Notify Reporter
        let reporterMessage = '';
        let reporterTitle = '';

        if (status === 'resolved') {
            reporterTitle = 'Report Resolved';
            reporterMessage = `We would like to inform you that we have reviewed the content you reported regarding ${businessName}. We have determined that it violates our Community Guidelines and have taken appropriate action to remove it. Thank you for your vigilance in helping keep our community safe.`;
        } else if (status === 'dismissed') {
            reporterTitle = 'Report Update';
            reporterMessage = `We would like to inform you that we have reviewed the content you reported regarding ${businessName}. After careful assessment, we found that it does not currently violate our Community Guidelines. We appreciate your concern.`;
        }

        if (status !== 'pending') {
            await Notification.create({
                user_id: report.reporter_id._id,
                type: 'report_result',
                title: reporterTitle,
                message: reporterMessage,
                link: businessLink,
                metadata: { report_id: report._id, status: status }
            });
        }

        // If report is resolved, hide the review and notify the review owner
        if (status === 'resolved') {
            await Review.findByIdAndUpdate(report.review_id._id, { is_hidden: true });

            // Recalculate business ratings and review count
            await updateBusinessAggregates(report.review_id.business_id._id);

            // Notify Review Owner
            const reasonText = decisionReason ? ` specifically regarding: ${decisionReason}` : '';
            const reviewOwnerMessage = `We are writing to inform you that your review for ${businessName} has been removed. This action was taken because the content was found to be in violation of our Community Guidelines${reasonText}. Please review our guidelines to ensure future contributions adhere to our standards.\n\n[Community Guidelines](/community-guidelines)`;

            await Notification.create({
                user_id: report.review_id.user_id._id,
                type: 'review_removed',
                title: 'Review Removed',
                message: reviewOwnerMessage,
                link: businessLink, // Link to business where review exists
                metadata: { review_id: report.review_id._id, report_id: report._id }
            });
        }

        return NextResponse.json({ success: true, report });
    } catch (error) {
        console.error('Error updating report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
