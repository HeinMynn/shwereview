import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Business, Review } from '@/lib/models';

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const business = await Business.findById(id).populate('owner_id', 'name email');

        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        // Check visibility
        if (business.status !== 'approved') {
            // We need to check session for ownership, but this is an API route
            // For simplicity in this context, we might just hide it or require auth
            // Let's use getServerSession to be secure
            const { getServerSession } = await import("next-auth/next");
            const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
            const session = await getServerSession(authOptions);

            const isOwner = session?.user?.id === business.submitted_by?.toString() || session?.user?.id === business.owner_id?._id?.toString();
            const isAdmin = session?.user?.role === 'Super Admin';

            if (!isOwner && !isAdmin) {
                return NextResponse.json({ error: 'Business not found' }, { status: 404 });
            }
        }

        const reviews = await Review.find({ business_id: id })
            .populate('user_id', 'name avatar badges')
            .sort({ createdAt: -1 });

        return NextResponse.json({ business, reviews });
    } catch (error) {
        console.error('Error fetching business:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
