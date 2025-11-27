'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from './ui';
import { User, LogOut, LayoutDashboard, Shield, AlertTriangle } from 'lucide-react';

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <>
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

                        <div className="flex items-center gap-4">
                            {session ? (
                                <>
                                    <div className="hidden md:flex items-center gap-4 mr-4 text-sm font-medium text-slate-600">
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
                                        <div className="hidden md:block text-right">
                                            <div className="text-sm font-bold text-slate-900">{session.user.name}</div>
                                            <div className="text-xs text-slate-500">{session.user.role}</div>
                                            {session.user.account_status === 'warning' && (
                                                <div className="text-xs text-yellow-600 font-bold flex items-center justify-end gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> Warning ({session.user.warning_count})
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
                                            <span className="hidden md:inline">Logout</span>
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
                    </div>
                </div>
            </nav>
        </>
    );
}
