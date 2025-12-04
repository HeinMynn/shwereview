'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import { Search, Trash2, Database, Filter } from 'lucide-react';
import Link from 'next/link';
import Toast from '@/components/Toast';

export default function AdminDataQuery() {
    const [dataType, setDataType] = useState('reviews');
    const [queryType, setQueryType] = useState('deleted');

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ userId: '', businessId: '' });
    const [toast, setToast] = useState(null);

    const fetchResults = async () => {
        setLoading(true);
        setResults([]);
        try {
            const params = new URLSearchParams();

            if (dataType === 'reviews' && queryType === 'deleted') {
                if (filters.userId) params.append('userId', filters.userId);
                if (filters.businessId) params.append('businessId', filters.businessId);

                const res = await fetch(`/api/admin/reviews/deleted?${params.toString()}`);
                const data = await res.json();

                if (res.ok) {
                    setResults(data.reviews);
                } else {
                    throw new Error(data.error || 'Failed to fetch results');
                }
            } else {
                // Placeholder for other query types
                setResults([]);
                setToast({ message: 'Query type not implemented yet', type: 'info' });
            }
        } catch (error) {
            console.error(error);
            setToast({ message: 'Failed to execute query', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch if needed, or wait for user action
    useEffect(() => {
        if (dataType === 'reviews' && queryType === 'deleted') {
            fetchResults();
        }
    }, [dataType, queryType]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchResults();
    };

    const renderFilters = () => {
        if (dataType === 'reviews' && queryType === 'deleted') {
            return (
                <>
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            name="userId"
                            placeholder="Filter by User ID"
                            value={filters.userId}
                            onChange={handleFilterChange}
                            className="w-full p-2 border rounded text-sm"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            name="businessId"
                            placeholder="Filter by Business ID"
                            value={filters.businessId}
                            onChange={handleFilterChange}
                            className="w-full p-2 border rounded text-sm"
                        />
                    </div>
                </>
            );
        }
        return <div className="text-gray-500 text-sm p-2">No specific filters for this query type.</div>;
    };

    const renderResults = () => {
        if (loading) return <div className="text-center py-8 text-gray-500">Loading...</div>;

        if (results.length === 0) {
            return <div className="text-center py-8 text-gray-500 bg-slate-50 rounded">No results found.</div>;
        }

        if (dataType === 'reviews' && queryType === 'deleted') {
            return (
                <div className="space-y-4">
                    {results.map((review) => (
                        <div key={review._id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-sm text-gray-500">
                                    <span className="font-bold text-slate-700">User:</span>{' '}
                                    <Link href={`/admin/users/${review.user_id?._id}`} className="text-indigo-600 hover:underline">
                                        {review.user_id?.name || 'Unknown'}
                                    </Link>
                                    <span className="mx-2">•</span>
                                    <span className="font-bold text-slate-700">Business:</span>{' '}
                                    <Link href={`/business/${review.business_id?._id}`} className="text-indigo-600 hover:underline">
                                        {review.business_id?.name || 'Unknown'}
                                    </Link>
                                </div>
                                <div className="text-xs text-gray-400">
                                    Deleted: {new Date(review.deletedAt || review.updatedAt).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="bg-slate-100 p-3 rounded text-sm text-slate-700 mb-2 italic">
                                "{review.text_content}"
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <span className="font-bold">Rating:</span> {review.overall_rating?.toFixed(1)}/5
                                </div>
                                <div>
                                    ID: <span className="font-mono">{review._id}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return <div>Results display not implemented for this type.</div>;
    };

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <Card className="p-6 bg-white">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-600" />
                    Data Query
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Data Type</label>
                        <select
                            value={dataType}
                            onChange={(e) => setDataType(e.target.value)}
                            className="w-full p-2 border rounded text-sm bg-white"
                        >
                            <option value="reviews">Reviews</option>
                            <option value="users">Users</option>
                            <option value="businesses">Businesses</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Query Type</label>
                        <select
                            value={queryType}
                            onChange={(e) => setQueryType(e.target.value)}
                            className="w-full p-2 border rounded text-sm bg-white"
                        >
                            {dataType === 'reviews' && (
                                <>
                                    <option value="deleted">Deleted Reviews</option>
                                    <option value="flagged">Flagged / Reported (TODO)</option>
                                </>
                            )}
                            {dataType === 'users' && (
                                <>
                                    <option value="suspended">Suspended Users (TODO)</option>
                                    <option value="banned">Banned Users (TODO)</option>
                                </>
                            )}
                            {dataType === 'businesses' && (
                                <>
                                    <option value="pending">Pending Approval (TODO)</option>
                                    <option value="rejected">Rejected (TODO)</option>
                                </>
                            )}
                        </select>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-bold text-gray-700">Filters</span>
                    </div>
                    <div className="flex flex-wrap gap-4 items-end">
                        {renderFilters()}
                        <Button type="submit" className="bg-indigo-600 text-white">
                            <Search className="w-4 h-4 mr-2" /> Run Query
                        </Button>
                        <Button type="button" variant="outline" onClick={() => {
                            setFilters({ userId: '', businessId: '' });
                            fetchResults();
                        }}>
                            Reset
                        </Button>
                    </div>
                </form>

                <div className="border-t border-slate-200 pt-6">
                    {renderResults()}
                </div>
            </Card>
        </div>
    );
}
