import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { businessId, plan } = await request.json();

        if (!businessId) {
            return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
        }

        // Verify ownership
        const business = await Business.findById(businessId);
        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const isOwner = business.owner_id?.toString() === session.user.id || business.submitted_by?.toString() === session.user.id;
        if (!isOwner && session.user.role !== 'Super Admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Mock Payment Processing
        // In a real app, we would create a Stripe PaymentIntent here

        // Update Business Subscription
        const updatedBusiness = await Business.findByIdAndUpdate(
            businessId,
            {
                subscription_tier: plan === 'pro' ? 'pro' : 'free',
                subscription_status: 'active',
                subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days
            },
            { new: true }
        );

        return NextResponse.json({ success: true, business: updatedBusiness });

    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
