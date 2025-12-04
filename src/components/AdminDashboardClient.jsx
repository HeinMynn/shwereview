'use client';

import { useState } from 'react';
import Link from 'next/link';
import AdminBusinessList from './AdminBusinessList';
import AdminReportList from './AdminReportList';
import AdminHomepageEditor from './AdminHomepageEditor';
import AdminNotificationSender from './AdminNotificationSender';
import AdminDataQuery from './AdminDataQuery';
import { Card } from '@/components/ui';
import { Users, Building2, AlertTriangle, LayoutGrid, FileText, Shield, Bell, Trash2, Database } from 'lucide-react';
import VerifiedBadge from './VerifiedBadge';

export default function AdminDashboardClient({ initialUsers, initialBusinesses, initialClaims }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [users] = useState(initialUsers);

    // Calculate stats
    const totalUsers = users.length;
    const totalBusinesses = initialBusinesses.length;
    const pendingBusinesses = initialBusinesses.filter(b => b.status === 'pending').length;
    const pendingClaims = initialClaims ? initialClaims.length : 0;
    const suspendedUsers = users.filter(u => u.account_status === 'suspended').length;

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
        >
            <Icon className="w-4 h-4 mr-2" />
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                    <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                        <Shield className="w-4 h-4 mr-1" /> Super Admin
                    </div>
                </div>

                <div className="flex space-x-1 bg-slate-200 p-1 rounded-lg mb-8 overflow-x-auto max-w-full">
                    <TabButton id="overview" label="Overview" icon={LayoutGrid} />
                    <TabButton id="businesses" label="Businesses" icon={Building2} />
                    <TabButton id="users" label="Users" icon={Users} />
                    <TabButton id="reports" label="Reports" icon={FileText} />
                    <TabButton id="notifications" label="Notifications" icon={Bell} />
                    <TabButton id="query" label="Query" icon={Database} />
                    <TabButton id="homepage" label="Homepage Editor" icon={LayoutGrid} />
                </div>

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-700">Total Users</div>
                                <div className="text-2xl font-bold">{totalUsers}</div>
                            </div>
                        </Card>
                        <Card className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-700">Total Businesses</div>
                                <div className="text-2xl font-bold">{totalBusinesses}</div>
                            </div>
                        </Card>
                        <Card className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-700">Pending Approvals</div>
                                <div className="text-2xl font-bold">{pendingBusinesses}</div>
                            </div>
                        </Card>
                        <Card className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-700">Pending Claims</div>
                                <div className="text-2xl font-bold">{pendingClaims}</div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'businesses' && (
                    <AdminBusinessList initialBusinesses={initialBusinesses} initialClaims={initialClaims} />
                )}

                {activeTab === 'users' && (
                    <div className="bg-white rounded-lg shadow overflow-x-auto border border-slate-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg mr-3">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                                        {user.name}
                                                        {user.phone_verified && (
                                                            <VerifiedBadge className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-600">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.account_status === 'active' ? 'bg-green-100 text-green-800' :
                                                user.account_status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {user.account_status || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/admin/users/${user._id}`} className="text-indigo-600 hover:text-indigo-900 font-bold">
                                                Manage
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <AdminReportList />
                )}

                {activeTab === 'homepage' && (
                    <AdminHomepageEditor />
                )}

                {activeTab === 'notifications' && (
                    <AdminNotificationSender users={users} />
                )}

                {activeTab === 'query' && (
                    <AdminDataQuery />
                )}
            </div>
        </div>
    );
}
