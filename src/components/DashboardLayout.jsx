'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, LogOut, ChevronRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui';
import { signOut } from 'next-auth/react';
import NotificationDropdown from './NotificationDropdown';

export default function DashboardLayout({ title, items, activeTab, setActiveTab, user, children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Handle responsiveness
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleTabClick = (id) => {
        // Only call setActiveTab if it's provided (legacy or state-based control)
        if (setActiveTab) setActiveTab(id);
        if (isMobile) setIsSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-3">
                    <button onClick={toggleSidebar} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-lg text-slate-900">{title}</span>
                </div>
                <div className="flex items-center gap-3">
                    <NotificationDropdown />
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                        {user?.name?.[0] || 'U'}
                    </div>
                </div>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50
                    w-64 bg-white border-r border-slate-200 flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
                    ${isMobile ? 'shadow-xl' : ''}
                `}
            >
                {/* Sidebar Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            ShweReview
                        </span>
                    </Link>
                    {isMobile && (
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* User Info (Desktop/Sidebar) */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg border border-indigo-200">
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-semibold text-slate-900 truncate">{user?.name}</p>
                            <p className="text-xs text-slate-500 truncate capitalize">{user?.role || 'User'}</p>
                        </div>
                    </div>
                    {/* Notification Bell in Sidebar Header for Desktop clarity or keep in User Info area? 
                        Let's put it in the main content header for desktop usually, but user asked for "dashboard".
                        We'll add it to the top-right of main content for Desktop, and keep it in mobile header above.
                    */}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                onClick={() => isMobile && setIsSidebarOpen(false)}
                                className={`
                                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                    ${isActive
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    {item.label}
                                </div>
                                {isActive && <ChevronRight className="w-4 h-4 text-indigo-400" />}
                            </Link>
                        );
                    })}

                    {/* Admin Link for Super Admin */}
                    {user?.role === 'Super Admin' && (
                        <Link
                            href="/admin"
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors mt-4 border-t border-slate-100 pt-4"
                        >
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-slate-400" />
                                Admin Panel
                            </div>
                        </Link>
                    )}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-100 mt-auto">
                    <Link href="/">
                        <Button variant="outline" className="w-full justify-start text-slate-600 mb-2 border-slate-200">
                            <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                            Back to Home
                        </Button>
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Desktop Header for Notifications */}
                <div className="hidden lg:flex h-16 bg-white border-b border-slate-200 items-center justify-end px-8">
                    <NotificationDropdown />
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
