
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { BusinessMetric } from '@/lib/models';

export async function POST(request) {
    try {
        const { businessId, eventType } = await request.json();

        if (!businessId || !eventType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const validEvents = ['view', 'click_website', 'click_call', 'click_direction', 'click_share'];
        if (!validEvents.includes(eventType)) {
            return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
        }

        await dbConnect();

        // Get start of today (UTC)
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        // Map eventType to schema field
        const updateField = eventType === 'view' ? 'views' :
            eventType === 'click_website' ? 'clicks_website' :
                eventType === 'click_call' ? 'clicks_call' :
                    eventType === 'click_direction' ? 'clicks_direction' :
                        eventType === 'click_share' ? 'clicks_share' : null;

        if (!updateField) {
            return NextResponse.json({ error: 'Mapping error' }, { status: 500 });
        }

        await BusinessMetric.findOneAndUpdate(
            { business_id: businessId, date: today },
            { $inc: { [updateField]: 1 } },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Analytics tracking error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
