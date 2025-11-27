'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, update } from 'next-auth/react';
import Link from 'next/link';
import { Bell, X, CheckCheck } from 'lucide-react';

export default function NotificationDropdown() {
    const { data: session, update } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (session) {
            fetchNotifications();

            // Poll for new notifications every 30 seconds
            const interval = setInterval(() => {
                fetchNotifications();
            }, 30000); // 30 seconds

            return () => clearInterval(interval);
        }
    }, [session]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications?unread_only=true');
            const data = await res.json();
            if (data.notifications) {
                let fetchedNotifications = data.notifications;

                // Inject persistent suspended notification if user is suspended
                if (session?.user?.account_status === 'suspended') {
                    const suspendedNotification = {
                        _id: 'suspended-alert',
                        title: 'Account Suspended',
                        message: 'Your account has been suspended due to policy violations. You cannot perform actions.',
                        type: 'alert',
                        is_read: false,
                        createdAt: new Date().toISOString(),
                        link: '/community-guidelines'
                    };
                    fetchedNotifications = [suspendedNotification, ...fetchedNotifications];
                }

                setNotifications(fetchedNotifications);
                setUnreadCount(fetchedNotifications.filter(n => !n.is_read).length);

                // Check if there's a new claim_approved notification - refresh session to update role
                const hasNewApproval = data.notifications.some(n =>
                    n.type === 'claim_approved' && !n.is_read
                );
                if (hasNewApproval && session) {
                    // Trigger session refresh to get updated user role
                    await update();
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
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
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications/read-all', {
                method: 'POST',
            });

            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markAsRead(notification._id);
        }
        setIsOpen(false);
    };

    if (!session) return null;

    const recentNotifications = notifications.slice(0, 10);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                disabled={loading}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                            >
                                <CheckCheck className="w-3 h-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {recentNotifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {recentNotifications.map((notification) => (
                                    <Link
                                        key={notification._id}
                                        href={notification.link || '#'}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`block p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-medium text-sm text-gray-900">
                                                {notification.title}
                                            </h4>
                                            {!notification.is_read && (
                                                <span className="w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 mb-1">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {notifications.length > 10 && (
                            <Link
                                href="/notifications"
                                onClick={() => setIsOpen(false)}
                                className="block p-3 text-center text-sm text-indigo-600 hover:bg-gray-50 font-medium border-t border-gray-200"
                            >
                                View all notifications
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
