'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card } from '@/components/ui';
import { Save, Loader2 } from 'lucide-react';

export default function AdminHomepageEditor() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/homepage-config');
            const data = await res.json();
            setConfig(data);
        } catch (error) {
            console.error('Failed to fetch config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/homepage-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            if (!res.ok) throw new Error('Failed to save configuration');

            setMessage({ type: 'success', text: 'Homepage updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading editor...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Homepage Editor</h2>
                <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </Button>
            </div>

            {message && (
                <div className={`p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                {/* Hero Section */}
                <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Hero Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Hero Title</label>
                            <Input
                                value={config.hero.title}
                                onChange={(e) => setConfig({ ...config, hero: { ...config.hero, title: e.target.value } })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Hero Subtitle</label>
                            <Input
                                value={config.hero.subtitle}
                                onChange={(e) => setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Background Image URL</label>
                            <Input
                                value={config.hero.backgroundImage}
                                onChange={(e) => setConfig({ ...config, hero: { ...config.hero, backgroundImage: e.target.value } })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Search Placeholder</label>
                            <Input
                                value={config.hero.searchPlaceholder}
                                onChange={(e) => setConfig({ ...config, hero: { ...config.hero, searchPlaceholder: e.target.value } })}
                            />
                        </div>
                    </div>
                </Card>

                {/* Stats Section */}
                <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Stats Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {config.stats.map((stat, index) => (
                            <div key={index} className="p-4 border rounded bg-slate-50 space-y-2">
                                <label className="block text-xs font-bold uppercase text-slate-500">Stat {index + 1}</label>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Label</label>
                                    <Input
                                        value={stat.label}
                                        onChange={(e) => {
                                            const newStats = [...config.stats];
                                            newStats[index].label = e.target.value;
                                            setConfig({ ...config, stats: newStats });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Value</label>
                                    <Input
                                        value={stat.value}
                                        onChange={(e) => {
                                            const newStats = [...config.stats];
                                            newStats[index].value = e.target.value;
                                            setConfig({ ...config, stats: newStats });
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* CTA Section */}
                <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">CTA Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <Input
                                value={config.cta.title}
                                onChange={(e) => setConfig({ ...config, cta: { ...config.cta, title: e.target.value } })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Subtitle</label>
                            <Input
                                value={config.cta.subtitle}
                                onChange={(e) => setConfig({ ...config, cta: { ...config.cta, subtitle: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Button Text</label>
                            <Input
                                value={config.cta.buttonText}
                                onChange={(e) => setConfig({ ...config, cta: { ...config.cta, buttonText: e.target.value } })}
                            />
                        </div>
                    </div>
                </Card>
            </form>
        </div>
    );
}
