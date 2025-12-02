'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { Send, Users, User, Shield } from 'lucide-react';
import Toast from '@/components/Toast';

export default function AdminNotificationSender({ users }) {
    const [recipientType, setRecipientType] = useState('All Users');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [link, setLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                title,
                message,
                link,
                recipientRole: recipientType !== 'Specific User' ? recipientType : undefined,
                userId: recipientType === 'Specific User' ? selectedUserId : undefined
            };

            const res = await fetch('/api/admin/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setToast({ message: data.message, type: 'success' });
                // Reset form
                setTitle('');
                setMessage('');
                setLink('');
            } else {
                setToast({ message: data.error || 'Failed to send', type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setToast({ message: 'An error occurred', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-6 bg-white shadow-sm border border-slate-200">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Send className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Send Notification</h2>
                    <p className="text-sm text-slate-500">Broadcast messages to your users</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Recipient</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                        {['All Users', 'Owner', 'Specific User'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setRecipientType(type)}
                                className={`p-3 rounded border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${recipientType === type
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {type === 'All Users' && <Users className="w-4 h-4" />}
                                {type === 'Owner' && <Shield className="w-4 h-4" />}
                                {type === 'Specific User' && <User className="w-4 h-4" />}
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {recipientType === 'Specific User' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select User</label>
                        <select
                            required
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">-- Select a user --</option>
                            {users.map(user => (
                                <option key={user._id} value={user._id}>
                                    {user.name} ({user.email}) - {user.role}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., New Feature Alert!"
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                    <textarea
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write your message here..."
                        rows="4"
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Link (Optional)</label>
                    <input
                        type="text"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder="e.g., /business/new"
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {loading ? 'Sending...' : 'Send Notification'}
                </Button>
            </form>
        </Card>
    );
}
