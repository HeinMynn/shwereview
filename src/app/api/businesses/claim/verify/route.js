import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';
import dns from 'dns';
import util from 'util';

const resolveTxt = util.promisify(dns.resolveTxt);

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { businessId, code, domain } = await request.json();

        const business = await Business.findById(businessId);
        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        if (business.claimant_id?.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized claim' }, { status: 403 });
        }

        console.log(`[VERIFY] Business ${businessId} method: ${business.claim_verification_method}`);

        if (business.claim_verification_method === 'dns') {
            if (!domain) return NextResponse.json({ error: 'Domain is required' }, { status: 400 });

            try {
                const records = await resolveTxt(domain);
                const flatRecords = records.flat();
                const expectedToken = business.claim_verification_data;

                if (flatRecords.includes(expectedToken)) {
                    business.claim_verification_status = 'verified';
                    business.claim_domain = domain; // Store verified domain
                    await business.save();
                    return NextResponse.json({ success: true, message: 'DNS verified successfully' });
                } else {
                    return NextResponse.json({ error: 'Verification token not found in DNS records' }, { status: 400 });
                }
            } catch (err) {
                console.error('DNS Lookup Error:', err);
                // Mock success for localhost/testing if real lookup fails
                // if (process.env.NODE_ENV === 'development') {
                //     console.log('[DEV] Mocking DNS verification success');
                //     business.claim_verification_status = 'verified';
                //     await business.save();
                //     return NextResponse.json({ success: true, message: 'DNS verified successfully (Mock)' });
                // }
                return NextResponse.json({ error: 'Failed to verify DNS records' }, { status: 400 });
            }
        } else if (business.claim_verification_method === 'email') {
            if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

            const [email, storedCode] = business.claim_verification_data.split('|');

            if (code === storedCode) {
                business.claim_verification_status = 'verified';
                // Clean up the code, keep only email
                business.claim_verification_data = email;
                await business.save();
                return NextResponse.json({ success: true, message: 'Email verified successfully' });
            } else {
                return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
            }
        }

        return NextResponse.json({ error: 'Invalid verification method' }, { status: 400 });
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
