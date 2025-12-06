import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Business, Notification } from '@/lib/models';

export const dynamic = 'force-dynamic'; // Ensure it runs every time

export async function GET(request) {
    try {
        // Authenticate Cron Request (Optional: Check for a secret header from Vercel Cron)
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        await dbConnect();

        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
        const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

        let notificationsSent = 0;
        let downgradedCount = 0;

        // --- Helper to start/end of day ---
        const startOfDay = (date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d;
        };
        const endOfDay = (date) => {
            const d = new Date(date);
            d.setHours(23, 59, 59, 999);
            return d;
        };

        // --- 1. CHECK PRO PLAN EXPIRATIONS ---

        // A. Expiring in 2 Days
        const businessesExpiringIn2Days = await Business.find({
            subscription_tier: 'pro',
            subscription_end_date: {
                $gte: startOfDay(twoDaysFromNow),
                $lte: endOfDay(twoDaysFromNow)
            }
        });

        for (const biz of businessesExpiringIn2Days) {
            // Check if notification already sent today to avoid spam (simple check)
            // Ideally we'd have a more robust 'last_notification_sent' tracking
            // For MVP, we trust the cron runs once daily or we check existing notifications
            const exists = await Notification.findOne({
                user_id: biz.owner_id,
                type: 'other',
                title: 'Pro Plan Expiring Soon',
                createdAt: { $gte: startOfDay(now) }
            });

            if (!exists && biz.owner_id) {
                await Notification.create({
                    user_id: biz.owner_id,
                    type: 'other',
                    title: 'Pro Plan Expiring Soon',
                    message: `Your Pro subscription for ${biz.name} will expire in 2 days. Renew now to keep your analytics access.`,
                    link: `/checkout?plan=pro&businessId=${biz._id}`
                });
                notificationsSent++;
            }
        }

        // B. Expiring Tomorrow (1 Day)
        const businessesExpiringIn1Day = await Business.find({
            subscription_tier: 'pro',
            subscription_end_date: {
                $gte: startOfDay(oneDayFromNow),
                $lte: endOfDay(oneDayFromNow)
            }
        });

        for (const biz of businessesExpiringIn1Day) {
            const exists = await Notification.findOne({
                user_id: biz.owner_id,
                type: 'other',
                title: 'Urgent: Pro Plan Expiring Tomorrow',
                createdAt: { $gte: startOfDay(now) }
            });

            if (!exists && biz.owner_id) {
                await Notification.create({
                    user_id: biz.owner_id,
                    type: 'other',
                    title: 'Urgent: Pro Plan Expiring Tomorrow',
                    message: `Your Pro subscription for ${biz.name} expires tomorrow! Don't lose your data insights.`,
                    link: `/checkout?plan=pro&businessId=${biz._id}`
                });
                notificationsSent++;
            }
        }

        // C. Expired Yesterday (Downgrade)
        // Find active pro businesses whose end date has passed
        const businessesExpired = await Business.find({
            subscription_tier: 'pro',
            subscription_end_date: { $lt: now }
        });

        for (const biz of businessesExpired) {
            // Downgrade
            biz.subscription_tier = 'free';
            biz.subscription_status = 'past_due'; // or 'none'
            await biz.save();
            downgradedCount++;

            // Notify
            if (biz.owner_id) {
                await Notification.create({
                    user_id: biz.owner_id,
                    type: 'other',
                    title: 'Pro Plan Expired',
                    message: `Your Pro subscription for ${biz.name} has expired. You have been downgraded to the free plan.`,
                    link: `/checkout?plan=pro&businessId=${biz._id}`
                });
                notificationsSent++;
            }
        }


        // --- 2. CHECK PROMOTE PLAN EXPIRATIONS ---

        // A. Expiring in 2 Days
        const promotedExpiringIn2Days = await Business.find({
            promoted_until: {
                $gte: startOfDay(twoDaysFromNow),
                $lte: endOfDay(twoDaysFromNow)
            }
        });

        for (const biz of promotedExpiringIn2Days) {
            const exists = await Notification.findOne({
                user_id: biz.owner_id,
                type: 'other',
                title: 'Promotion Ending Soon',
                createdAt: { $gte: startOfDay(now) }
            });

            if (!exists && biz.owner_id) {
                await Notification.create({
                    user_id: biz.owner_id,
                    type: 'other',
                    title: 'Promotion Ending Soon',
                    message: `Your promotion for ${biz.name} will end in 2 days. Extend it to keep your visibility high!`,
                    link: `/business/${biz._id}/dashboard` // Link to dashboard ad manager
                });
                notificationsSent++;
            }
        }

        // B. Expiring Tomorrow
        const promotedExpiringIn1Day = await Business.find({
            promoted_until: {
                $gte: startOfDay(oneDayFromNow),
                $lte: endOfDay(oneDayFromNow)
            }
        });

        for (const biz of promotedExpiringIn1Day) {
            const exists = await Notification.findOne({
                user_id: biz.owner_id,
                title: 'Urgent: Promotion Ending Tomorrow',
                createdAt: { $gte: startOfDay(now) }
            });

            if (!exists && biz.owner_id) {
                await Notification.create({
                    user_id: biz.owner_id,
                    type: 'other',
                    title: 'Urgent: Promotion Ending Tomorrow',
                    message: `Your ad campaign for ${biz.name} ends tomorrow.`,
                    link: `/business/${biz._id}/dashboard`
                });
                notificationsSent++;
            }
        }

        // C. Expired Yesterday
        const promotedExpired = await Business.find({
            promoted_until: {
                $lt: now,
                $gte: startOfDay(yesterday) // Only notify for recently expired to avoid spamming old ones
            }
        });

        for (const biz of promotedExpired) {
            const exists = await Notification.findOne({
                user_id: biz.owner_id,
                title: 'Promotion Ended',
                createdAt: { $gte: startOfDay(now) }
            });

            if (!exists && biz.owner_id) {
                await Notification.create({
                    user_id: biz.owner_id,
                    type: 'other',
                    title: 'Promotion Ended',
                    message: `Your promotion for ${biz.name} has ended. Hope you got some great customers!`,
                    link: `/business/${biz._id}/dashboard`
                });
                notificationsSent++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed expirations.`,
            stats: {
                notificationsSent,
                downgradedCount
            }
        });

    } catch (error) {
        console.error('Cron error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
