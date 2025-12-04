'use client';

import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Toast from './Toast';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function AdminReportList() {
    const { data, error } = useSWR('/api/admin/reports', fetcher, {
        refreshInterval: 15000,
        revalidateOnFocus: true,
    });

    const reports = data?.reports || [];
    const loading = !data && !error;
    const [toast, setToast] = useState(null);

    const [decisionModal, setDecisionModal] = useState({ isOpen: false, reportId: null, status: null });
    const [decisionReason, setDecisionReason] = useState('');

    const openDecisionModal = (reportId, status) => {
        setDecisionModal({ isOpen: true, reportId, status });
        setDecisionReason('');
    };

    const closeDecisionModal = () => {
        setDecisionModal({ isOpen: false, reportId: null, status: null });
        setDecisionReason('');
    };

    const handleStatusUpdate = async () => {
        const { reportId, status } = decisionModal;
        if (!reportId || !status) return;

        try {
            const res = await fetch('/api/admin/reports', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId, status, decisionReason }),
            });

            if (res.ok) {
                mutate('/api/admin/reports');
                setToast({ message: `Report marked as ${status}`, type: 'success' });
                closeDecisionModal();
            } else {
                throw new Error('Failed to update');
            }
        } catch (error) {
            console.error('Error updating report:', error);
            setToast({ message: 'Failed to update report', type: 'error' });
        }
    };

    const suggestedReasons = {
        resolved: [
            "Violates Community Guidelines (Harassment)",
            "Violates Community Guidelines (Spam)",
            "Irrelevant Content",
            "Conflict of Interest"
        ],
        dismissed: [
            "Does not violate Community Guidelines",
            "Insufficient evidence",
            "Subjective opinion protected by policy"
        ]
    };

    if (loading) return <div>Loading reports...</div>;

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden relative">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {decisionModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">
                            {decisionModal.status === 'resolved' ? 'Resolve Report (Remove Review)' : 'Dismiss Report (Keep Review)'}
                        </h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for decision (sent to user)
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {suggestedReasons[decisionModal.status]?.map((reason) => (
                                    <button
                                        key={reason}
                                        type="button"
                                        onClick={() => setDecisionReason(reason)}
                                        className={`text-xs px-2 py-1 rounded border transition-colors ${decisionReason === reason
                                                ? 'bg-indigo-100 border-indigo-500 text-indigo-700 font-medium'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
                                            }`}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={decisionReason}
                                onChange={(e) => setDecisionReason(e.target.value)}
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows="3"
                                placeholder="Enter reason..."
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={closeDecisionModal}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleStatusUpdate}
                                className={decisionModal.status === 'resolved' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'}
                            >
                                Confirm
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Reported By</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Review Content</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reports.map((report) => (
                            <tr key={report._id} className={report.status === 'pending' ? 'bg-red-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {report.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900 capitalize">{report.reason}</div>
                                    {report.custom_reason && (
                                        <div className="text-sm text-gray-600 italic">"{report.custom_reason}"</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {report.reporter_id?.name || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                    {report.review_id ? (
                                        <>
                                            <div className="font-medium text-gray-900 mb-1">
                                                Review by {report.review_id.user_id?.name || 'Unknown'}
                                            </div>
                                            "{report.review_id.text_content}"
                                            <Link
                                                href={`/business/${report.review_id.business_id}`}
                                                className="ml-2 text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                                                target="_blank"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </>
                                    ) : (
                                        <span className="italic text-gray-500">Review deleted</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    {report.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => openDecisionModal(report._id, 'resolved')}
                                                className="text-green-600 hover:text-green-900"
                                                title="Mark as Resolved"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => openDecisionModal(report._id, 'dismissed')}
                                                className="text-gray-600 hover:text-gray-900"
                                                title="Dismiss"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
