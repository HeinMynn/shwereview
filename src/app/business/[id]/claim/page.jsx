'use client';

import { useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import Link from 'next/link';
import { FileText, Globe, Mail, CheckCircle, Copy } from 'lucide-react';

export default function ClaimBusinessPage({ params }) {
    const { id } = use(params); // Fix for params access in Next.js 15+
    const { data: session } = useSession();
    const router = useRouter();

    const [method, setMethod] = useState('document');
    const [documentUrl, setDocumentUrl] = useState('');
    const [domain, setDomain] = useState('');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    const [step, setStep] = useState(1); // 1: Input, 2: Verify (for DNS/Email)
    const [dnsToken, setDnsToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInitiateClaim = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = {
                businessId: id,
                method,
                data: method === 'document' ? documentUrl : method === 'email' ? email : null
            };

            const res = await fetch('/api/businesses/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to initiate claim');

            if (method === 'document') {
                alert('Claim submitted successfully! Admin will review it.');
                router.push(`/business/${id}`);
            } else if (method === 'dns') {
                setDnsToken(data.token);
                setStep(2);
            } else if (method === 'email') {
                setStep(2);
                alert('Verification code sent to your email (Check console for mock code)');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setError('');
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

            alert('Verification successful! Claim submitted.');
            router.push(`/business/${id}`);
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
                            onClick={() => { setMethod('document'); setStep(1); }}
                            className={`flex-1 pb-4 text-center font-medium text-sm ${method === 'document' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FileText className="w-4 h-4 inline-block mr-2" /> Document
                        </button>
                        <button
                            onClick={() => { setMethod('dns'); setStep(1); }}
                            className={`flex-1 pb-4 text-center font-medium text-sm ${method === 'dns' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Globe className="w-4 h-4 inline-block mr-2" /> DNS Record
                        </button>
                        <button
                            onClick={() => { setMethod('email'); setStep(1); }}
                            className={`flex-1 pb-4 text-center font-medium text-sm ${method === 'email' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Mail className="w-4 h-4 inline-block mr-2" /> Email
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Document Method */}
                    {method === 'document' && (
                        <form onSubmit={handleInitiateClaim} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Proof of Ownership URL</label>
                                <p className="text-xs text-gray-500 mb-2">Link to a business license, utility bill, or official website.</p>
                                <Input
                                    value={documentUrl}
                                    onChange={(e) => setDocumentUrl(e.target.value)}
                                    required
                                    placeholder="https://example.com/proof.pdf"
                                />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? 'Submitting...' : 'Submit Claim'}
                            </Button>
                        </form>
                    )}

                    {/* DNS Method */}
                    {method === 'dns' && (
                        <div className="space-y-6">
                            {step === 1 ? (
                                <form onSubmit={handleInitiateClaim}>
                                    <p className="text-sm text-gray-600 mb-4">
                                        We will generate a unique TXT record. You must add it to your domain's DNS settings.
                                    </p>
                                    <Button type="submit" disabled={loading} className="w-full">
                                        {loading ? 'Generating Token...' : 'Generate Verification Token'}
                                    </Button>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-slate-100 p-4 rounded border border-slate-200">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Add this TXT record to your domain:</p>
                                        <div className="flex items-center justify-between bg-white p-2 rounded border">
                                            <code className="text-sm text-indigo-600 break-all">{dnsToken}</code>
                                            <button onClick={() => navigator.clipboard.writeText(dnsToken)} className="text-gray-400 hover:text-gray-600">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Domain</label>
                                        <Input
                                            value={domain}
                                            onChange={(e) => setDomain(e.target.value)}
                                            placeholder="example.com"
                                        />
                                    </div>
                                    <Button onClick={handleVerify} disabled={loading || !domain} className="w-full">
                                        {loading ? 'Verifying...' : 'Verify DNS Record'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Email Method */}
                    {method === 'email' && (
                        <div className="space-y-6">
                            {step === 1 ? (
                                <form onSubmit={handleInitiateClaim}>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
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
                                    <p className="text-sm text-gray-600">
                                        Enter the code sent to <b>{email}</b>
                                    </p>
                                    <Input
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        placeholder="123456"
                                    />
                                    <Button onClick={handleVerify} disabled={loading || !verificationCode} className="w-full">
                                        {loading ? 'Verifying...' : 'Verify Code'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </main>
    );
}
