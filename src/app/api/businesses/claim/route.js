import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business, User, Notification } from '@/lib/models';
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

        if (business.claim_status === 'pending' && business.claimant_id?.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Claim already pending by another user' }, { status: 400 });
        }

        business.claim_status = 'pending';
        business.claimant_id = session.user.id;
        business.claim_verification_method = method;
        business.claim_verification_status = 'pending';

        let responseData = {};

        if (method === 'document') {
            if (!data) return NextResponse.json({ error: 'Proof file is required' }, { status: 400 });

            try {
                const uploadResponse = await cloudinary.uploader.upload(data, {
                    folder: 'shwereview/claims',
                    resource_type: 'auto', // Auto-detect image type
                });
                business.claim_proof = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error('Cloudinary upload failed:', uploadError);
                return NextResponse.json({ error: 'Failed to upload proof document' }, { status: 500 });
            }
        } else if (method === 'dns') {
            if (!data) return NextResponse.json({ error: 'Domain is required' }, { status: 400 });

            // Store the domain used for verification
            business.claim_domain = data;

            // Generate a unique TXT record token if not already present
            let token = business.claim_verification_data;
            if (!token || !token.startsWith('shwereview-verification=')) {
                token = `shwereview-verification=${crypto.randomBytes(16).toString('hex')}`;
                business.claim_verification_data = token;
            }
            responseData = { token };
        } else if (method === 'email') {
            if (!data) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

            // Store the email used for verification
            business.claim_email = data;

            const code = crypto.randomInt(100000, 999999).toString();

            // Send real email
            const emailResult = await sendVerificationEmail(data, code);

            if (!emailResult.success) {
                console.error(`Failed to send claim verification email: ${emailResult.error}`);

                // Notify Super Admins
                const superAdmins = await User.find({ role: 'Super Admin' });
                const notificationPromises = superAdmins.map(admin =>
                    Notification.create({
                        user_id: admin._id,
                        type: 'other',
                        title: 'Claim Email Failed',
                        message: `Failed to send claim verification email to user ${session.user.name} for business "${business.name}". Error: ${emailResult.error}`,
                        link: `/admin`,
                        metadata: {
                            business_id: business._id.toString(),
                            business_name: business.name,
                            claimant_id: session.user.id,
                            error: emailResult.error
                        }
                    })
                );
                await Promise.all(notificationPromises);

                return NextResponse.json({ error: 'Failed to send verification email. Please try again later.' }, { status: 500 });
            }

            // Store code temporarily
            business.claim_verification_data = `${data}|${code}`;
            business.claim_last_sent_at = new Date(); // Set initial timestamp
            responseData = { message: 'Verification code sent to your email' };
        }

        await business.save();

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
                    method: method
                }
            })
        );
        await Promise.all(notificationPromises);

        return NextResponse.json({ success: true, business, ...responseData });
    } catch (error) {
        console.error('Claim error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
