'use client';

import { useState } from 'react';
import Link from 'next/link';
import AdminBusinessList from '@/components/AdminBusinessList';
import AdminReportList from '@/components/AdminReportList';

export default function AdminDashboardClient({ initialUsers, initialBusinesses }) {
    const [activeTab, setActiveTab] = useState('businesses');
    const [users] = useState(initialUsers);

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Admin Dashboard</h1>

                <div className="flex space-x-4 mb-6 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('businesses')}
                        className={`pb-2 px-4 font-medium ${activeTab === 'businesses' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-600'}`}
                    >
                        Businesses
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-2 px-4 font-medium ${activeTab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-600'}`}
                    >
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`pb-2 px-4 font-medium ${activeTab === 'reports' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-600'}`}
                    >
                        Reports
                    </button>
                </div>

                {activeTab === 'businesses' && (
                    <AdminBusinessList initialBusinesses={initialBusinesses} />
                )}

                {activeTab === 'users' && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link href={`/admin/users/${user._id}`} className="text-indigo-600 hover:underline font-medium">
                                                {user.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.account_status === 'active' ? 'bg-green-100 text-green-800' :
                                                    user.account_status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {user.account_status || 'active'}
                                            </span>
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
            </div>
        </div>
    );
}
