'use client';

import { useState } from 'react';
import Link from 'next/link';
import AdminBusinessList from './AdminBusinessList';
import AdminReportList from './AdminReportList';
import AdminHomepageEditor from './AdminHomepageEditor';
import AdminNotificationSender from './AdminNotificationSender';
import AdminPricingEditor from '@/components/AdminPricingEditor';
import { DollarSign } from 'lucide-react';
import AdminDataQuery from './AdminDataQuery';
import { Card } from '@/components/ui';
import { Users, Building2, AlertTriangle, LayoutGrid, FileText, Shield, Bell, Trash2, Database } from 'lucide-react';
import VerifiedBadge from './VerifiedBadge';
import DashboardLayout from '@/components/DashboardLayout';
import { useSearchParams } from 'next/navigation';

export default function AdminDashboardClient({ initialUsers, initialBusinesses, initialClaims }) {
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';
    const [users, setUsers] = useState(initialUsers);
    const [businesses, setBusinesses] = useState(initialBusinesses);

    // Calculate stats
    const totalUsers = users.length;
    const totalBusinesses = businesses.length;
    const pendingBusinesses = businesses.filter(b => b.status === 'pending').length;
    const pendingClaims = initialClaims ? initialClaims.length : 0;
    const suspendedUsers = users.filter(u => u.account_status === 'suspended').length;

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutGrid, href: '/admin?tab=overview' },
        { id: 'businesses', label: 'Businesses', icon: Building2, href: '/admin?tab=businesses' },
        { id: 'users', label: 'Users', icon: Users, href: '/admin?tab=users' },
        { id: 'reports', label: 'Reports', icon: FileText, href: '/admin?tab=reports' },
        { id: 'notifications', label: 'Notifications', icon: Bell, href: '/admin?tab=notifications' },
        { id: 'query', label: 'Query', icon: Database, href: '/admin?tab=query' },
        { id: 'homepage', label: 'Homepage', icon: LayoutGrid, href: '/admin?tab=homepage' },
        { id: 'pricing', label: 'Pricing', icon: DollarSign, href: '/admin?tab=pricing' },
    ];

    return (
        <DashboardLayout
            title="Admin Dashboard"
            items={menuItems}
            activeTab={activeTab}
            user={{ name: 'Super Admin', role: 'Super Admin' }} // Mock or fetch actual admin user if available
        >
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">{menuItems.find(i => i.id === activeTab)?.label}</h1>
                <p className="text-slate-500">Manage your platform settings and data.</p>
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
                <AdminBusinessList
                    initialBusinesses={initialBusinesses}
                    initialClaims={initialClaims}
                />
            )}

            {activeTab === 'users' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-bold">
                            {users.length} Total
                        </span>
                        {suspendedUsers > 0 && (
                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                                {suspendedUsers} Suspended
                            </span>
                        )}
                    </div>
                    {/* User list logic here if extracted to component, otherwise keep existing structure...
                        Note: The previous file had full user list implementation inline or assumed. 
                        I will assume AdminUserControls handles the actions but the list is rendered here. 
                        Wait, look at line 17 'const [users] = useState(initialUsers)'. 
                        I need to check if there was a list rendering block I'm overwriting.
                        Yes, I am overwriting the whole return. I should verify the original file content regarding the 'users' tab.
                     */}
                </div>
            )}

            {/* ... wait, I need to preserve the content of each tab. 
                The replace_file_content tool replaces a block. I should replace the wrapper and navigation, 
                but keep the tab content logic if it's complex. 
                However, to switch to the layout, I need to wrap everything.
                Let me check the file content again to see the 'users' tab implementation.
            */}

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

            {activeTab === 'pricing' && ( // Added conditional rendering for Pricing tab
                <AdminPricingEditor />
            )}

            {activeTab === 'query' && (
                <AdminDataQuery />
            )}
        </DashboardLayout>
    );
}
