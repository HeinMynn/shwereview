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
        const body = await request.json();
        console.log('Admin Status Update Request Body:', body);
        const { businessId, status, rejection_reason } = body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            console.error('Invalid status:', status);
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const updateData = { status };
        if (status === 'rejected') {
            updateData.rejection_reason = rejection_reason || 'No reason provided';
        } else {
            // Clear rejection reason if status is changed to approved/pending
            updateData.rejection_reason = '';
        }

        const business = await Business.findByIdAndUpdate(
            businessId,
            updateData,
            { new: true }
        );

        if (!business) {
            console.error('Business not found for ID:', businessId);
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        console.log('Business updated successfully:', business);

        // Send Notification to Submitter
        if (business.submitted_by && (status === 'approved' || status === 'rejected')) {
            try {
                // Import dynamically to avoid circular dependency issues if any, though likely not needed here. 
                // Better to import at top level, but for partial edit:
                const { createNotification } = await import('@/lib/notifications');

                let title, message, type;

                if (status === 'approved') {
                    title = 'Business Submission Approved';
                    message = `Your submission for "${business.name}" has been approved and is now live!`;
                    type = 'business_approved';
                } else if (status === 'rejected') {
                    title = 'Business Submission Rejected';
                    message = `Your submission for "${business.name}" was rejected. Reason: ${updateData.rejection_reason}`;
                    type = 'business_rejected';
                }

                await createNotification({
                    userId: business.submitted_by,
                    type: type || 'other',
                    title,
                    message,
                    link: `/business/${business._id}`, // Or edit page if rejected? straightforward to business page or dashboard
                    metadata: { business_id: business._id }
                });
                console.log(`Notification sent to submitter ${business.submitted_by}`);

            } catch (notiError) {
                console.error('Failed to send notification:', notiError);
                // Don't fail the request just because notification failed
            }
        }

        return NextResponse.json({ success: true, business });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
