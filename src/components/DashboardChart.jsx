'use client';

import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card } from './ui';

export default function DashboardChart({ data, title, series }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">{title}</h3>
                <div className="h-[300px] w-full flex items-center justify-center bg-slate-50">
                    Loading Chart...
                </div>
            </Card>
        );
    }

    // Default to single value series if not provided
    const chartSeries = series || [{ key: 'value', color: '#8884d8', name: 'Average Rating' }];

    return (
        <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">{title}</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Legend />
                        {chartSeries.map((s) => (
                            <Line
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.name}
                                stroke={s.color}
                                activeDot={{ r: 8 }}
                                connectNulls
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
