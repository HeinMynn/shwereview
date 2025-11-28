'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from './ui';
import { User, LogOut, LayoutDashboard, Shield, AlertTriangle, Menu, X, Search } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
    const { data: session } = useSession();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            {session?.user?.account_status === 'suspended' && (
                <div className="bg-red-600 text-white text-center py-2 px-4 text-sm font-bold">
                    <Shield className="w-4 h-4 inline-block mr-2" />
                    Your account has been suspended. You cannot perform any actions. Please contact support.
                </div>
            )}
            {session?.user?.account_status === 'warning' && (
                <div className="bg-yellow-500 text-white text-center py-2 px-4 text-sm font-bold">
                    <AlertTriangle className="w-4 h-4 inline-block mr-2" />
                    Your account has received a warning. Please review our <Link href="/community-guidelines" className="underline hover:text-yellow-100">community guidelines</Link>.
                </div>
            )}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                    S
                                </div>
                                <span className="font-bold text-xl text-slate-900">ShweReview</span>
                            </Link>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-4">
                            <Link href="/search" className="text-slate-500 hover:text-indigo-600 p-2">
                                <Search className="w-5 h-5" />
                            </Link>

                            {session ? (
                                <>
                                    <div className="flex items-center gap-4 mr-4 text-sm font-medium text-slate-600">
                                        {session.user.role === 'Super Admin' && (
                                            <Link href="/admin" className="flex items-center gap-1 hover:text-indigo-600">
                                                <Shield className="w-4 h-4" /> Admin
                                            </Link>
                                        )}
                                        {(session.user.role === 'Owner' || session.user.role === 'Super Admin') && (
                                            <Link href="/dashboard" className="flex items-center gap-1 hover:text-indigo-600">
                                                <LayoutDashboard className="w-4 h-4" /> Dashboard
                                            </Link>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                                        <NotificationDropdown />
                                        <div className="text-right flex items-center">
                                            <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-200">
                                                    {session.user.avatar ? (
                                                        <img src={session.user.avatar} alt={session.user.name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        session.user.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                            </Link>
                                            {session.user.account_status === 'warning' && (
                                                <div className="ml-2 text-xs text-yellow-600 font-bold flex items-center gap-1" title={`Warning (${session.user.warning_count})`}>
                                                    <AlertTriangle className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => signOut({ callbackUrl: '/' })}
                                            className="flex items-center gap-2"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="hidden lg:inline">Logout</span>
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm">Login</Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button size="sm">Register</Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex items-center md:hidden gap-4">
                            <Link href="/search" className="text-slate-500 hover:text-indigo-600">
                                <Search className="w-5 h-5" />
                            </Link>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-slate-500 hover:text-slate-900 focus:outline-none"
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-slate-200 px-4 pt-2 pb-4 shadow-lg">
                        <div className="flex flex-col gap-4">
                            {session ? (
                                <>
                                    <div className="py-2 border-b border-slate-100">
                                        <Link href="/profile" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-200">
                                                {session.user.avatar ? (
                                                    <img src={session.user.avatar} alt={session.user.name} className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    session.user.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{session.user.name}</div>
                                                <div className="text-sm text-slate-500">{session.user.role}</div>
                                            </div>
                                        </Link>
                                    </div>

                                    {session.user.role === 'Super Admin' && (
                                        <Link href="/admin" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Shield className="w-4 h-4" /> Admin Panel
                                        </Link>
                                    )}
                                    {(session.user.role === 'Owner' || session.user.role === 'Super Admin') && (
                                        <Link href="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                                        </Link>
                                    )}

                                    <Button
                                        variant="outline"
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="w-full justify-center mt-2"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" /> Logout
                                    </Button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-2 mt-2">
                                    <Link href="/login" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button variant="ghost" className="w-full justify-center">Login</Button>
                                    </Link>
                                    <Link href="/register" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button className="w-full justify-center">Register</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
}
