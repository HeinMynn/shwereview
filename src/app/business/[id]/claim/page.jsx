'use client';

import { useState, use, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import Link from 'next/link';
import { FileText, Globe, Mail, CheckCircle, Copy } from 'lucide-react';
import VerificationInput from '@/components/VerificationInput';

export default function ClaimBusinessPage({ params }) {
    const { id } = use(params); // Fix for params access in Next.js 15+
    const { data: session } = useSession();
    const router = useRouter();

    const [method, setMethod] = useState('document');
    const [documentUrl, setDocumentUrl] = useState('');
    const [documentUploadMode, setDocumentUploadMode] = useState('file'); // 'file' or 'url'
    const [uploadProgress, setUploadProgress] = useState(0);
    const [email, setEmail] = useState('');
    const [domain, setDomain] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    const [steps, setSteps] = useState({ document: 1, dns: 1, email: 1 }); // Track step for each method
    const [dnsToken, setDnsToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(180); // 3 minutes

    useEffect(() => {
        const fetchClaimStatus = async () => {
            try {
                const res = await fetch(`/api/businesses/${id}`);
                const data = await res.json();

                if (data.userClaim) {
                    const claim = data.userClaim;
                    setMethod(claim.verification_method);

                    if (claim.verification_method === 'dns') {
                        setDomain(claim.domain || '');
                        setDnsToken(claim.verification_data);
                        // If verified, show success/pending approval, else show verify step
                        if (claim.verification_status === 'verified') {
                            setSuccess('DNS verified! Waiting for admin approval.');
                            setSteps(prev => ({ ...prev, dns: 2 })); // Or a new 'completed' step
                        } else {
                            setSteps(prev => ({ ...prev, dns: 2 }));
                        }
                    } else if (claim.verification_method === 'email') {
                        const [emailAddr] = claim.verification_data.split('|');
                        setEmail(emailAddr);
                        if (claim.verification_status === 'verified') {
                            setSuccess('Email verified! Waiting for admin approval.');
                            setSteps(prev => ({ ...prev, email: 2 }));
                        } else {
                            setSteps(prev => ({ ...prev, email: 2 }));
                        }
                    } else if (claim.verification_method === 'document') {
                        setSuccess('Document submitted! Waiting for admin approval.');
                    }
                }
            } catch (err) {
                console.error("Failed to fetch claim status", err);
            }
        };

        if (session) {
            fetchClaimStatus();
        }
    }, [id, session]);

    useEffect(() => {
        let timer;
        if (resendCountdown > 0) {
            timer = setInterval(() => {
                setResendCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendCountdown]);

    const handleResend = async () => {
        setError('');
        setSuccess('');
        setIsResending(true);

        try {
            const res = await fetch('/api/businesses/claim/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId: id, email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to resend code');
            }

            setSuccess('Verification code resent! Please check your email.');
            setResendCountdown(180); // Reset timer
        } catch (err) {
            setError(err.message);
        } finally {
            setIsResending(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError('File size must be less than 2MB');
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            setError('Only JPG, PNG, and GIF files are allowed');
            return;
        }

        setLoading(true);
        setError('');
        setUploadProgress(0);

        const reader = new FileReader();
        reader.onloadend = () => {
            setDocumentUrl(reader.result); // Store Base64 string
            setUploadProgress(100);
            setLoading(false);
        };
        reader.onerror = () => {
            setError('Failed to read file');
            setLoading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleInitiateClaim = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const payload = {
                businessId: id,
                method,
                data: method === 'document' ? documentUrl : method === 'email' ? email : method === 'dns' ? domain : null
            };

            const res = await fetch('/api/businesses/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to initiate claim');

            if (method === 'document') {
                setSuccess('Claim submitted successfully! Admin will review it.');
                setTimeout(() => router.push(`/business/${id}`), 2000);
            } else if (method === 'dns') {
                setDnsToken(data.token);
                setSteps(prev => ({ ...prev, dns: 2 }));
            } else if (method === 'email') {
                setSteps(prev => ({ ...prev, email: 2 }));
                setSuccess('Verification code sent to your email');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const payload = {
                businessId: id,
                code: method === 'email' ? verificationCode : null,
                domain: method === 'dns' ? domain : null
            };

            const res = await fetch('/api/businesses/claim/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Verification failed');

            setSuccess('Verification successful! Claim submitted.');
            setTimeout(() => router.push(`/business/${id}`), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
                <Card className="p-6 max-w-md w-full text-center">
                    <h2 className="text-xl font-bold mb-2">Claim Business</h2>
                    <p className="text-gray-600 mb-4">Please login to claim this business.</p>
                    <Link href="/login">
                        <Button>Login</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Claim Business</h1>

                <Card className="p-6">
                    {/* Method Tabs */}
                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            onClick={() => setMethod('document')}
                            className={`flex-1 pb-4 text-center font-medium text-sm ${method === 'document' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FileText className="w-4 h-4 inline-block mr-2" /> Document
                        </button>
                        <button
                            onClick={() => setMethod('dns')}
                            className={`flex-1 pb-4 text-center font-medium text-sm ${method === 'dns' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Globe className="w-4 h-4 inline-block mr-2" /> DNS Record
                        </button>
                        <button
                            onClick={() => setMethod('email')}
                            className={`flex-1 pb-4 text-center font-medium text-sm ${method === 'email' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Mail className="w-4 h-4 inline-block mr-2" /> Email
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-sm border border-green-200">
                            {success}
                        </div>
                    )}

                    {/* Document Method */}
                    {method === 'document' && (
                        <form onSubmit={handleInitiateClaim} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-2">Proof of Ownership</label>
                                <p className="text-xs text-gray-600 mb-4">Upload a business license, utility bill, or official document.</p>

                                {/* Tab selection */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setDocumentUploadMode('file')}
                                        className={`px-4 py-2 rounded text-sm font-medium ${documentUploadMode === 'file'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Upload File
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDocumentUploadMode('url')}
                                        className={`px-4 py-2 rounded text-sm font-medium ${documentUploadMode === 'url'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Provide URL
                                    </button>
                                </div>

                                {documentUploadMode === 'file' ? (
                                    <div>
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.gif"
                                            onChange={handleFileUpload}
                                            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Accepted formats: JPG, PNG, GIF (Max 2MB)
                                        </p>
                                        {uploadProgress > 0 && uploadProgress < 100 && (
                                            <div className="mt-2">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-indigo-600 h-2 rounded-full transition-all"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
                                            </div>
                                        )}
                                        {documentUrl && (
                                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                                                ✓ File selected
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Input
                                        value={documentUrl}
                                        onChange={(e) => setDocumentUrl(e.target.value)}
                                        required
                                        placeholder="https://example.com/proof.pdf"
                                    />
                                )}
                            </div>
                            <Button type="submit" disabled={loading || (documentUploadMode === 'file' && !documentUrl)} className="w-full">
                                {loading ? 'Submitting...' : 'Submit Claim'}
                            </Button>
                        </form>
                    )}

                    {/* DNS Method */}
                    {method === 'dns' && (
                        <div className="space-y-6">
                            {steps.dns === 1 ? (
                                <form onSubmit={handleInitiateClaim}>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-800 mb-1">Your Domain</label>
                                        <p className="text-xs text-gray-600 mb-2">
                                            Enter the domain you own and have access to modify DNS records.
                                        </p>
                                        <Input
                                            value={domain}
                                            onChange={(e) => setDomain(e.target.value)}
                                            placeholder="example.com"
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={loading || !domain} className="w-full mt-4">
                                        {loading ? 'Generating Token...' : 'Generate Verification Token'}
                                    </Button>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-slate-100 p-4 rounded border border-slate-200">
                                        <p className="text-xs font-bold text-gray-700 uppercase mb-1">Add this TXT record to your domain:</p>
                                        <div className="flex items-center justify-between bg-white p-2 rounded border">
                                            <code className="text-sm text-indigo-600 break-all">{dnsToken}</code>
                                            <button onClick={() => navigator.clipboard.writeText(dnsToken)} className="text-gray-600 hover:text-gray-800">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-800 mb-1">Confirm Your Domain</label>
                                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                            <code className="text-sm text-gray-900">{domain}</code>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Make sure you've added the TXT record above to this domain's DNS settings.
                                        </p>
                                    </div>
                                    <Button onClick={handleVerify} disabled={loading} className="w-full">
                                        {loading ? 'Verifying...' : 'Verify DNS Record'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Email Method */}
                    {method === 'email' && (
                        <div className="space-y-6">
                            {steps.email === 1 ? (
                                <form onSubmit={handleInitiateClaim}>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-800 mb-1">Business Email</label>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="owner@business.com"
                                        />
                                    </div>
                                    <Button type="submit" disabled={loading} className="w-full mt-4">
                                        {loading ? 'Sending...' : 'Send Verification Code'}
                                    </Button>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-700">
                                        Enter the code sent to <b>{email}</b>
                                    </p>
                                    <div className="flex justify-center mb-4">
                                        <VerificationInput
                                            value={verificationCode}
                                            onChange={setVerificationCode}
                                        />
                                    </div>
                                    <Button onClick={handleVerify} disabled={loading || !verificationCode} className="w-full">
                                        {loading ? 'Verifying...' : 'Verify Code'}
                                    </Button>
                                    <div className="text-center mt-4">
                                        <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleResend}
                                            disabled={resendCountdown > 0 || isResending}
                                            className="w-full"
                                        >
                                            {isResending ? 'Sending...' : resendCountdown > 0 ? `Resend in ${Math.floor(resendCountdown / 60)}:${(resendCountdown % 60).toString().padStart(2, '0')}` : 'Resend Code'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </main>
    );
}
