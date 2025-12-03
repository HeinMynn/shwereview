import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business, User, Notification, BusinessClaim } from '@/lib/models';

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Super Admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { claimId, action } = await request.json(); // action: 'approve' or 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const claim = await BusinessClaim.findById(claimId);
        if (!claim) {
            return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
        }

        const business = await Business.findById(claim.business_id);
        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        if (action === 'approve') {
            // 1. Approve this claim
            claim.status = 'approved';
            await claim.save();

            // 2. Update business owner and status
            business.owner_id = claim.claimant_id;
            business.claim_status = 'approved';
            await business.save();

            // 3. Update User role to Owner
            const claimant = await User.findById(claim.claimant_id);
            if (claimant && claimant.role !== 'Super Admin') {
                await User.findByIdAndUpdate(claim.claimant_id, { role: 'Owner' });
            }

            // 4. Reject all OTHER pending claims for this business
            await BusinessClaim.updateMany(
                { business_id: business._id, _id: { $ne: claimId }, status: 'pending' },
                { status: 'rejected' }
            );

            // 5. Notify the approved user
            await Notification.create({
                user_id: claim.claimant_id,
                type: 'claim_approved',
                title: 'Business Claim Approved',
                message: `Your claim for "${business.name}" has been approved! You are now the owner.`,
                link: `/business/${business._id}`,
                metadata: {
                    business_id: business._id.toString(),
                    business_name: business.name,
                }
            });

            // 6. Notify rejected users (optional but good UX)
            // We could find them and send notifications, but for now let's stick to the main flow.

        } else {
            // Reject this specific claim
            claim.status = 'rejected';
            await claim.save();

            // Check if there are any other pending claims
            const otherPendingClaims = await BusinessClaim.countDocuments({
                business_id: business._id,
                status: 'pending'
            });

            // If no other pending claims, set business status back to unclaimed
            if (otherPendingClaims === 0) {
                business.claim_status = 'unclaimed';
                await business.save();
            }

            // Notify the rejected user
            await Notification.create({
                user_id: claim.claimant_id,
                type: 'claim_rejected',
                title: 'Business Claim Rejected',
                message: `Your claim for "${business.name}" has been rejected. Please contact support if you believe this is an error.`,
                link: `/business/${business._id}`,
                metadata: {
                    business_id: business._id.toString(),
                    business_name: business.name,
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Claim processing error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
