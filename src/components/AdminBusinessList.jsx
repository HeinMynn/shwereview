'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import Toast from './Toast';

export default function AdminBusinessList({ initialBusinesses }) {
    const router = useRouter();
    const [businesses, setBusinesses] = useState(initialBusinesses || []);
    const [loadingId, setLoadingId] = useState(null);
    const [toast, setToast] = useState(null);

    // Sync with server data when it changes (e.g. after router.refresh)
    useEffect(() => {
        setBusinesses(initialBusinesses);
    }, [initialBusinesses]);

    // Auto-refresh business list every 15 seconds for real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh(); // Refresh server components data
        }, 15000); // 15 seconds

        return () => clearInterval(interval);
    }, [router]);

    const updateStatus = async (businessId, newStatus) => {
        console.log('Updating status for:', businessId, 'to', newStatus);
        setLoadingId(businessId);
        try {
            const res = await fetch('/api/admin/business-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId, status: newStatus }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(`Server Error (${res.status}): ${data.error || 'Unknown error'}`);
            }

            // Update local state
            setBusinesses(prev => prev.map(b =>
                b._id === businessId ? { ...b, status: data.business.status } : b
            ));

            // Force reload to ensure data consistency
            window.location.reload();
        } catch (error) {
            console.error('Update failed:', error);
            setToast({ message: `Failed to update status: ${error.message}`, type: 'error' });
        } finally {
            setLoadingId(null);
        }
    };

    const toggleVerification = async (businessId, currentStatus) => {
        setLoadingId(businessId);
        try {
            const res = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId, isVerified: !currentStatus }),
            });

            if (!res.ok) throw new Error('Failed to update');

            const data = await res.json();

            // Update local state
            setBusinesses(prev => prev.map(b =>
                b._id === businessId ? { ...b, is_verified: data.business.is_verified } : b
            ));

            router.refresh(); // Refresh server components if needed
        } catch (error) {
            console.error(error);
            setToast({ message: 'Failed to update verification status', type: 'error' });
        } finally {
            setLoadingId(null);
        }
    };

    const handleClaim = async (businessId, action) => {
        setLoadingId(businessId);
        try {
            const res = await fetch('/api/admin/claim-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId, action }),
            });

            if (!res.ok) throw new Error('Failed to update claim');

            const data = await res.json();

            // Update local state
            setBusinesses(prev => prev.map(b =>
                b._id === businessId ? {
                    ...b,
                    claim_status: data.business.claim_status,
                    owner_id: data.business.owner_id // Update owner if approved
                } : b
            ));

            router.refresh();
        } catch (error) {
            console.error(error);
            setToast({ message: 'Failed to process claim', type: 'error' });
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-8 relative">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            {/* Pending Claims Section */}
            {businesses.some(b => b.claim_status === 'pending') && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h3 className="font-bold text-orange-800 mb-4">Pending Claims</h3>
                    <div className="space-y-3">
                        {businesses.filter(b => b.claim_status === 'pending').map(business => (
                            <div key={business._id} className="bg-white p-3 rounded border border-orange-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-gray-900">{business.name}</div>

                                        {/* Claimant Info */}
                                        <div className="text-sm text-gray-700 mt-1">
                                            <span className="font-semibold">Claimant:</span>{' '}
                                            {business.claimant_id?.name || 'Unknown'}{' '}
                                            <span className="text-gray-600">({business.claimant_id?.email || 'N/A'})</span>
                                        </div>

                                        <div className="mt-1 text-xs">
                                            <span className="font-bold text-gray-700">Method: </span>
                                            <span className="uppercase bg-gray-200 px-2 py-0.5 rounded text-gray-900 font-medium">{business.claim_verification_method || 'Document'}</span>
                                        </div>

                                        {business.claim_verification_method === 'document' && business.claim_proof && (
                                            <a href={business.claim_proof} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block mt-1">
                                                View Proof Document
                                            </a>
                                        )}

                                        {business.claim_verification_method === 'dns' && (
                                            <div className="text-xs mt-1 space-y-1">
                                                <div className="mb-1">
                                                    <span className="font-semibold text-gray-700">Domain:</span>{' '}
                                                    <span className="bg-blue-50 px-2 py-0.5 rounded text-gray-900 font-medium">
                                                        {business.claim_domain || 'Not provided'}
                                                    </span>
                                                </div>
                                                <div className="text-gray-700">
                                                    <span className="font-semibold">Token:</span>{' '}
                                                    <code className="bg-gray-100 px-1 text-gray-900">{business.claim_verification_data?.substring(0, 20)}...</code>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-700">Status:</span>{' '}
                                                    <span className={`font-bold ${business.claim_verification_status === 'verified' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {business.claim_verification_status}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {business.claim_verification_method === 'email' && (
                                            <div className="text-xs text-gray-700 mt-1">
                                                <div className="mb-1">
                                                    <span className="font-semibold">Verification Email:</span>{' '}
                                                    <span className="bg-blue-50 px-2 py-0.5 rounded text-gray-900 font-medium">{business.claim_email || business.claim_verification_data?.split('|')[0]}</span>
                                                </div>
                                                <span className={`font-bold ${business.claim_verification_status === 'verified' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {business.claim_verification_status}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white h-8"
                                            onClick={() => handleClaim(business._id, 'approve')}
                                            disabled={loadingId === business._id}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-red-600 hover:bg-red-700 text-white h-8"
                                            onClick={() => handleClaim(business._id, 'reject')}
                                            disabled={loadingId === business._id}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Business List */}
            <div>
                <h3 className="font-bold text-gray-800 mb-4">All Businesses</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {businesses.map(business => (
                        <div key={business._id} className="p-3 bg-white border rounded-lg flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-gray-900 flex items-center gap-2">
                                        {business.name}
                                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${business.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            business.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {business.status || 'pending'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        Owner: {business.owner_id ? (business.owner_id.name || 'Assigned') : 'Unclaimed'}
                                    </div>
                                    <div className="text-xs text-gray-600 uppercase mt-1">{business.category}</div>
                                </div>

                                <button
                                    onClick={() => toggleVerification(business._id, business.is_verified)}
                                    disabled={loadingId === business._id}
                                    className={`flex items-center px-3 py-1.5 rounded text-sm font-bold transition-colors ${business.is_verified
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {loadingId === business._id ? (
                                        <span className="animate-pulse">...</span>
                                    ) : business.is_verified ? (
                                        <CheckCircle className="w-4 h-4" />
                                    ) : (
                                        <XCircle className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {(!business.status || business.status === 'pending') && (
                                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100 justify-end">
                                    <button
                                        type="button"
                                        className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateStatus(business._id, 'approved');
                                        }}
                                        disabled={loadingId === business._id}
                                        title="Approve"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateStatus(business._id, 'rejected');
                                        }}
                                        disabled={loadingId === business._id}
                                        title="Reject"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
