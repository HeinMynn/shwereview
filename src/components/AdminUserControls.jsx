'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { AlertTriangle, Ban, ShieldAlert, CheckCircle } from 'lucide-react';
import Toast from './Toast';

export default function AdminUserControls({ user }) {
    const router = useRouter();
    const [status, setStatus] = useState(user.account_status || 'active');
    const [warningCount, setWarningCount] = useState(user.warning_count || 0);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const handleAction = async (action, newStatus) => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id, action, status: newStatus }),
            });

            if (!res.ok) throw new Error('Failed to update user');

            const data = await res.json();
            setStatus(data.user.account_status);
            setWarningCount(data.user.warning_count);

            const message = action === 'warn'
                ? `User warned. Count: ${data.user.warning_count}`
                : action === 'reset_warnings'
                    ? `Warning count reset to 0`
                    : `User status updated to ${data.user.account_status}`;

            setToast({ message, type: 'success' });
            router.refresh();
        } catch (error) {
            console.error(error);
            setToast({ message: 'Failed to update user', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 relative">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-white rounded border">
                    <div className="text-sm text-gray-500">Status</div>
                    <div className={`font-bold capitalize ${status === 'banned' ? 'text-red-600' :
                        status === 'suspended' ? 'text-orange-600' :
                            status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                        {status}
                    </div>
                </div>
                <div className="p-4 bg-white rounded border">
                    <div className="text-sm text-gray-500">Warnings</div>
                    <div className="font-bold text-xl">{warningCount}</div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button
                    onClick={() => handleAction('warn')}
                    disabled={loading || status === 'banned'}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                    <AlertTriangle className="w-4 h-4 mr-2" /> Warn User
                </Button>

                {status === 'warning' && (
                    <Button
                        onClick={() => handleAction('update', 'active')}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 text-white"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" /> Dismiss Warning
                    </Button>
                )}

                {warningCount > 0 && (
                    <Button
                        onClick={() => handleAction('reset_warnings')}
                        disabled={loading}
                        variant="outline"
                        className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                    >
                        Reset Count
                    </Button>
                )}

                {status !== 'suspended' && status !== 'banned' && (
                    <Button
                        onClick={() => handleAction('update', 'suspended')}
                        disabled={loading}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                        <ShieldAlert className="w-4 h-4 mr-2" /> Suspend
                    </Button>
                )}

                {status === 'suspended' && (
                    <Button
                        onClick={() => handleAction('update', 'active')}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 text-white"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" /> Reactivate
                    </Button>
                )}

                {status !== 'banned' && (
                    <Button
                        onClick={() => handleAction('update', 'banned')}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Ban className="w-4 h-4 mr-2" /> Ban User
                    </Button>
                )}
                {status === 'banned' && (
                    <Button
                        onClick={() => handleAction('update', 'active')}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 text-white"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" /> Unban
                    </Button>
                )}
            </div>
        </div>
    );
}
