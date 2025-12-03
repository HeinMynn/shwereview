import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business, User, Notification, BusinessClaim } from '@/lib/models';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { businessId, method, data } = await request.json();

        if (!method) {
            return NextResponse.json({ error: 'Verification method is required' }, { status: 400 });
        }

        const business = await Business.findById(businessId);

        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        if (business.owner_id) {
            return NextResponse.json({ error: 'Business is already owned' }, { status: 400 });
        }

        // Check if user already has a pending claim for this business
        const existingClaim = await BusinessClaim.findOne({
            business_id: businessId,
            claimant_id: session.user.id,
            status: 'pending'
        });

        if (existingClaim) {
            return NextResponse.json({ error: 'You already have a pending claim for this business' }, { status: 400 });
        }

        const claim = new BusinessClaim({
            business_id: businessId,
            claimant_id: session.user.id,
            verification_method: method,
            status: 'pending',
            verification_status: 'pending'
        });

        let responseData = {};

        if (method === 'document') {
            if (!data) return NextResponse.json({ error: 'Proof file is required' }, { status: 400 });

            try {
                const uploadResponse = await cloudinary.uploader.upload(data, {
                    folder: 'shwereview/claims',
                    resource_type: 'auto', // Auto-detect image type
                });
                claim.proof = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error('Cloudinary upload failed:', uploadError);
                return NextResponse.json({ error: 'Failed to upload proof document' }, { status: 500 });
            }
        } else if (method === 'dns') {
            if (!data) return NextResponse.json({ error: 'Domain is required' }, { status: 400 });

            // Store the domain used for verification
            claim.domain = data;

            // Generate a unique TXT record token
            const token = `shwereview-verification=${crypto.randomBytes(16).toString('hex')}`;
            claim.verification_data = token;
            responseData = { token };
        } else if (method === 'email') {
            if (!data) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

            // Store the email used for verification
            claim.email = data;

            const code = crypto.randomInt(100000, 999999).toString();

            // Send real email
            const emailResult = await sendVerificationEmail(data, code);

            if (!emailResult.success) {
                console.error(`Failed to send claim verification email: ${emailResult.error}`);
                // ... (Admin notification logic remains similar but updated for Claim model if needed)
                return NextResponse.json({ error: 'Failed to send verification email. Please try again later.' }, { status: 500 });
            }

            // Store code temporarily
            claim.verification_data = `${data}|${code}`;
            claim.last_sent_at = new Date(); // Set initial timestamp
            responseData = { message: 'Verification code sent to your email' };
        }

        await claim.save();

        // Update business claim status to pending if it was unclaimed
        if (business.claim_status === 'unclaimed') {
            business.claim_status = 'pending';
            await business.save();
        }

        // Create notifications for all Super Admins
        const superAdmins = await User.find({ role: 'Super Admin' });
        const notificationPromises = superAdmins.map(admin =>
            Notification.create({
                user_id: admin._id,
                type: 'claim_pending',
                title: 'New Business Claim',
                message: `${session.user.name} has submitted a claim for "${business.name}" using ${method} verification.`,
                link: `/admin`,
                metadata: {
                    business_id: business._id.toString(),
                    business_name: business.name,
                    claimant_id: session.user.id,
                    claimant_name: session.user.name,
                    method: method,
                    claim_id: claim._id.toString()
                }
            })
        );
        await Promise.all(notificationPromises);

        return NextResponse.json({ success: true, claim, ...responseData });
    } catch (error) {
        console.error('Claim error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
