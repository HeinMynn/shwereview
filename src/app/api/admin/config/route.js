import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { SystemConfig } from '@/lib/models';
import { NextResponse } from 'next/server';

// Helper to get or create config
async function getSystemConfig() {
    let config = await SystemConfig.findOne({ key: 'pricing' });
    if (!config) {
        config = await SystemConfig.create({
            key: 'pricing',
            pricing: {
                pro_monthly: 29,
                promote_7_days: 5,
                promote_30_days: 15
            }
        });
    }
    return config;
}

export async function GET(req) {
    try {
        await dbConnect();
        const config = await getSystemConfig();
        return NextResponse.json(config.pricing);
    } catch (error) {
        console.error("Failed to fetch system config:", error);
        return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'Super Admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { pro_monthly, promote_7_days, promote_30_days } = body;

        // Validation
        if ([pro_monthly, promote_7_days, promote_30_days].some(val => val < 0 || isNaN(val))) {
            return NextResponse.json({ error: "Invalid pricing values" }, { status: 400 });
        }

        await dbConnect();

        const config = await SystemConfig.findOne({ key: 'pricing' });
        // Should exist due to getSystemConfig logic, but handle just in case or utilize updateOne with upsert

        const updatedConfig = await SystemConfig.findOneAndUpdate(
            { key: 'pricing' },
            {
                $set: {
                    'pricing.pro_monthly': Number(pro_monthly),
                    'pricing.promote_7_days': Number(promote_7_days),
                    'pricing.promote_30_days': Number(promote_30_days)
                }
            },
            { new: true, upsert: true }
        );

        return NextResponse.json({ message: "Configuration updated", pricing: updatedConfig.pricing });

    } catch (error) {
        console.error("Failed to update system config:", error);
        return NextResponse.json({ error: "Failed to update configuration" }, { status: 500 });
    }
}
