import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business, BusinessClaim } from '@/lib/models';
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

        // Find the specific claim for this user
        const claim = await BusinessClaim.findOne({
            business_id: businessId,
            claimant_id: session.user.id,
            status: 'pending'
        });

        if (!claim) {
            return NextResponse.json({ error: 'No pending claim found' }, { status: 404 });
        }

        console.log(`[VERIFY] Claim ${claim._id} method: ${claim.verification_method}`);

        if (claim.verification_method === 'dns') {
            if (!domain) return NextResponse.json({ error: 'Domain is required' }, { status: 400 });

            try {
                const records = await resolveTxt(domain);
                const flatRecords = records.flat();
                const expectedToken = claim.verification_data;

                if (flatRecords.includes(expectedToken)) {
                    claim.verification_status = 'verified';
                    claim.domain = domain; // Store verified domain
                    await claim.save();
                    return NextResponse.json({ success: true, message: 'DNS verified successfully' });
                } else {
                    return NextResponse.json({ error: 'Verification token not found in DNS records' }, { status: 400 });
                }
            } catch (err) {
                console.error('DNS Lookup Error:', err);
                // Mock success for localhost/testing if real lookup fails
                // if (process.env.NODE_ENV === 'development') {
                //     console.log('[DEV] Mocking DNS verification success');
                //     claim.verification_status = 'verified';
                //     await claim.save();
                //     return NextResponse.json({ success: true, message: 'DNS verified successfully (Mock)' });
                // }
                return NextResponse.json({ error: 'Failed to verify DNS records' }, { status: 400 });
            }
        } else if (claim.verification_method === 'email') {
            if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

            const [email, storedCode] = claim.verification_data.split('|');

            // Check for expiration (15 minutes)
            if (claim.last_sent_at) {
                const expirationTime = 15 * 60 * 1000; // 15 minutes
                const timeElapsed = Date.now() - new Date(claim.last_sent_at).getTime();

                if (timeElapsed > expirationTime) {
                    return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
                }
            }

            if (code === storedCode) {
                claim.verification_status = 'verified';
                // Clean up the code, keep only email
                claim.verification_data = email;
                await claim.save();
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
