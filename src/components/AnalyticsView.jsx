'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { BarChart2, Calendar, MousePointer, Share2, Users, ArrowUp, ArrowDown } from 'lucide-react';

export default function AnalyticsView({ businessId, isPro }) {
    const [dateRange, setDateRange] = useState('30d'); // 30d, 7d, today, yesterday, custom
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    useEffect(() => {
        fetchMetrics();
    }, [dateRange, customStart, customEnd]);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            let query = `?range=${dateRange}`;
            if (dateRange === 'custom') {
                if (!customStart || !customEnd) return; // Wait for both dates
                query += `&start=${customStart}&end=${customEnd}`;
            }

            const res = await fetch(`/api/business/${businessId}/analytics${query}`);
            if (res.ok) {
                const data = await res.json();
                setMetrics(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !metrics) {
        return <div className="p-8 text-center text-slate-500">Loading analytics...</div>;
    }

    if (!metrics) return null;

    return (
        <div className="space-y-6">
            {/* Header / Filter */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-slate-700">Date Range:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {['today', 'yesterday', '7d', '30d'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === range
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {range === 'today' && 'Today'}
                            {range === 'yesterday' && 'Yesterday'}
                            {range === '7d' && 'Last 7 Days'}
                            {range === '30d' && 'Last 30 Days'}
                        </button>
                    ))}
                    <button
                        onClick={() => setDateRange('custom')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === 'custom'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Custom
                    </button>
                </div>
            </div>

            {dateRange === 'custom' && (
                <div className="flex flex-col md:flex-row justify-end items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                    <input
                        type="date"
                        className="p-1 border rounded"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                    />
                    <span className="text-slate-400">-</span>
                    <input
                        type="date"
                        className="p-1 border rounded"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                    />
                </div>
            )}

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Views"
                    value={metrics.totalViews}
                    icon={Users}
                    color="indigo"
                />
                <StatCard
                    label="Website Clicks"
                    value={metrics.clicks_website}
                    icon={MousePointer}
                    color="green"
                />
                <StatCard
                    label="Shares"
                    value={metrics.clicks_share}
                    icon={Share2}
                    color="blue"
                />
                <StatCard
                    label="Contact Actions" // Calls + Directions
                    value={metrics.clicks_contact}
                    icon={BarChart2}
                    color="orange"
                    subtext={`${metrics.clicks_call} Calls, ${metrics.clicks_direction} Directions`}
                />
            </div>

            {/* Simple Visualizer (Placeholder for Charts) */}
            {isPro ? (
                <Card className="p-6">
                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-indigo-600" />
                        Engagement Trends
                    </h3>
                    {/* Render a simple bar chart using CSS grid/flex if data allows */}
                    <div className="h-64 flex items-end justify-between gap-2 border-b border-slate-200 pb-2">
                        {metrics.daily.map((day, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group relative">
                                <div
                                    className="w-full bg-indigo-500 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                                    style={{ height: `${Math.max(5, (day.views / (Math.max(...metrics.daily.map(d => d.views)) || 1)) * 100)}%` }}
                                ></div>
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                    {new Date(day.date).toLocaleDateString()} - {day.views} Views
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            ) : (
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-8 text-center text-white">
                    <h3 className="text-xl font-bold mb-2">Unlock Trends & Deep Insights</h3>
                    <p className="text-slate-300 mb-4">Upgrade to Pro to see daily breakdown and engagement charts.</p>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, subtext }) {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600',
        green: 'bg-green-50 text-green-600',
        blue: 'bg-blue-50 text-blue-600',
        orange: 'bg-orange-50 text-orange-600',
    };

    return (
        <Card className="p-4 border-l-4" style={{ borderLeftColor: `var(--${color}-500)` }}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{value?.toLocaleString() || 0}</p>
                    {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
                </div>
                <div className={`p-2 rounded-full ${colorClasses[color] || 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </Card>
    );
}
