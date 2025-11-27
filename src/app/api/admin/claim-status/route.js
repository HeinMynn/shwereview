import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business, User } from '@/lib/models';

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

            // Update User role to Owner if not already
            await User.findByIdAndUpdate(business.claimant_id, { role: 'Owner' });
        } else {
            business.claim_status = 'rejected';
        }

        // Clear claimant info after processing (optional, but good for history if we had a separate collection. Here we keep status but maybe clear temp fields? Let's keep them for record for now)
        // Actually, if rejected, we might want to allow re-claiming.
        if (action === 'rejected') {
            business.claim_status = 'unclaimed'; // Reset to unclaimed so others can claim
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
