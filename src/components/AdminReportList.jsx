'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Toast from './Toast';

export default function AdminReportList() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchReports();

        // Auto-refresh reports every 15 seconds for real-time updates
        const interval = setInterval(() => {
            fetchReports();
        }, 15000); // 15 seconds

        return () => clearInterval(interval);
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/admin/reports');
            const data = await res.json();
            if (data.success) {
                setReports(data.reports);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (reportId, newStatus) => {
        try {
            const res = await fetch('/api/admin/reports', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId, status: newStatus }),
            });

            if (res.ok) {
                setReports(reports.map(r =>
                    r._id === reportId ? { ...r, status: newStatus } : r
                ));
                setToast({ message: `Report marked as ${newStatus}`, type: 'success' });
            }
        } catch (error) {
            console.error('Error updating report:', error);
            setToast({ message: 'Failed to update report', type: 'error' });
        }
    };

    if (loading) return <div>Loading reports...</div>;

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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
                                                onClick={() => handleStatusUpdate(report._id, 'resolved')}
                                                className="text-green-600 hover:text-green-900"
                                                title="Mark as Resolved"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(report._id, 'dismissed')}
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
