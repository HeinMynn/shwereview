'use client';

import DashboardLayout from './DashboardLayout';
import { BarChart2, Users } from 'lucide-react';

export default function BusinessDashboardWrapper({ user, businessName, children }) {
    const menuItems = [
        { id: 'overview', label: 'Overview', icon: BarChart2, href: '/dashboard?tab=overview' },
        { id: 'businesses', label: 'My Businesses', icon: Users, href: '/dashboard?tab=businesses' },
    ];

    return (
        <DashboardLayout
            title={`Owner Dashboard: ${businessName}`}
            items={menuItems}
            activeTab="overview" // This page is effectively an extended overview/analytics view
            user={user}
        >
            {children}
        </DashboardLayout>
    );
}
