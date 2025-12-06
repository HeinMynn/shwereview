import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Business, BusinessMetric, Review } from '@/lib/models';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Basic auth check - owner or admin
        const business = await Business.findById(id).lean();
        if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const isOwner = business.owner_id?.toString() === session.user.id;
        const isAdmin = session.user.role === 'Super Admin';
        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const url = new URL(request.url);
        const range = url.searchParams.get('range') || '30d';
        let startDate = new Date();
        let endDate = new Date();
        endDate.setUTCHours(23, 59, 59, 999);

        // Calculate Date Range
        if (range === 'today') {
            startDate.setUTCHours(0, 0, 0, 0);
        } else if (range === 'yesterday') {
            startDate.setDate(startDate.getDate() - 1);
            startDate.setUTCHours(0, 0, 0, 0);
            endDate.setDate(endDate.getDate() - 1); // Only for yesterday
            endDate.setUTCHours(23, 59, 59, 999);
        } else if (range === '7d') {
            startDate.setDate(startDate.getDate() - 7);
            startDate.setUTCHours(0, 0, 0, 0);
        } else if (range === '30d') {
            startDate.setDate(startDate.getDate() - 30);
            startDate.setUTCHours(0, 0, 0, 0);
        } else if (range === 'custom') {
            const startParam = url.searchParams.get('start');
            const endParam = url.searchParams.get('end');
            if (startParam) startDate = new Date(startParam);
            if (endParam) endDate = new Date(endParam);
            endDate.setUTCHours(23, 59, 59, 999); // Ensure full end day included
        }

        // Fetch Metrics
        const metrics = await BusinessMetric.aggregate([
            {
                $match: {
                    business_id: business._id,
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" },
                    clicks_website: { $sum: "$clicks_website" },
                    clicks_call: { $sum: "$clicks_call" },
                    clicks_direction: { $sum: "$clicks_direction" },
                    clicks_share: { $sum: "$clicks_share" }
                }
            }
        ]);

        // Daily breakdown for chart (Pro only usually, but let's send for now)
        const daily = await BusinessMetric.find({
            business_id: business._id,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 }).select('date views clicks_website clicks_call clicks_direction clicks_share').lean();

        const data = metrics[0] || { totalViews: 0, clicks_website: 0, clicks_call: 0, clicks_direction: 0, clicks_share: 0 };
        data.clicks_contact = (data.clicks_call || 0) + (data.clicks_direction || 0);
        data.daily = daily;

        return NextResponse.json(data);

    } catch (error) {
        console.error('Analytics Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
