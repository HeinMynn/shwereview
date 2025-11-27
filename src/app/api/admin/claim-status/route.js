import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business, User, Notification } from '@/lib/models';

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Super Admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { businessId, action } = await request.json(); // action: 'approve' or 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const business = await Business.findById(businessId);
        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        if (action === 'approve') {
            if (!business.claimant_id) {
                return NextResponse.json({ error: 'No claimant found' }, { status: 400 });
            }

            // Update business owner
            business.owner_id = business.claimant_id;
            business.claim_status = 'approved';

            // Update User role to Owner only if they're not already Super Admin
            const claimant = await User.findById(business.claimant_id);
            if (claimant && claimant.role !== 'Super Admin') {
                await User.findByIdAndUpdate(business.claimant_id, { role: 'Owner' });
            }

            // Create approval notification
            await Notification.create({
                user_id: business.claimant_id,
                type: 'claim_approved',
                title: 'Business Claim Approved',
                message: `Your claim for "${business.name}" has been approved! You are now the owner.`,
                link: `/business/${business._id}`,
                metadata: {
                    business_id: business._id.toString(),
                    business_name: business.name,
                }
            });
        } else {
            business.claim_status = 'rejected';

            // Create rejection notification
            if (business.claimant_id) {
                await Notification.create({
                    user_id: business.claimant_id,
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

            // Reset to unclaimed so others can claim
            business.claim_status = 'unclaimed';
            business.claimant_id = null;
            business.claim_proof = null;
        }

        await business.save();

        return NextResponse.json({ success: true, business });
    } catch (error) {
        console.error('Claim processing error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
