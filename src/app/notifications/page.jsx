'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';

export default function NotificationsPage() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [markingAllRead, setMarkingAllRead] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

    useEffect(() => {
        if (session) {
            fetchNotifications();
        }
    }, [session]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (res.ok) {
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const res = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
            });

            if (res.ok) {
                setNotifications(prev =>
                    prev.map(n => n._id === notificationId ? { ...n, is_read: true } : n)
                );
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        setMarkingAllRead(true);
        try {
            const res = await fetch('/api/notifications/read-all', {
                method: 'POST',
            });

            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        } finally {
            setMarkingAllRead(false);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markAsRead(notification._id);
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
                <Card className="p-6 max-w-md w-full text-center">
                    <h2 className="text-xl font-bold mb-2">Notifications</h2>
                    <p className="text-gray-600 mb-4">Please login to view notifications.</p>
                    <Link href="/login">
                        <Button>Login</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.is_read;
        if (filter === 'read') return n.is_read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <main className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
                    {unreadCount > 0 && (
                        <Button
                            onClick={markAllAsRead}
                            disabled={markingAllRead}
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            {markingAllRead ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCheck className="w-4 h-4" />
                            )}
                            Mark all as read
                        </Button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 font-medium text-sm ${filter === 'all'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        All ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 font-medium text-sm ${filter === 'unread'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Unread ({unreadCount})
                    </button>
                    <button
                        onClick={() => setFilter('read')}
                        className={`px-4 py-2 font-medium text-sm ${filter === 'read'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Read ({notifications.length - unreadCount})
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            No notifications
                        </h3>
                        <p className="text-gray-500">
                            {filter === 'all'
                                ? "You don't have any notifications yet."
                                : `You don't have any ${filter} notifications.`}
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((notification) => (
                            <Card
                                key={notification._id}
                                className={`p-4 hover:shadow-md transition-shadow ${!notification.is_read ? 'border-l-4 border-l-indigo-600 bg-blue-50' : ''
                                    }`}
                            >
                                <Link
                                    href={notification.link || '#'}
                                    onClick={() => handleNotificationClick(notification)}
                                    className="block"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">
                                                {notification.title}
                                            </h3>
                                            {!notification.is_read && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${notification.type === 'claim_approved'
                                                    ? 'bg-green-100 text-green-800'
                                                    : notification.type === 'claim_rejected'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {notification.type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 mb-2">{notification.message}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </Link>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
