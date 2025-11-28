'use client';

import { useState } from 'react';

import { Card, Button } from '@/components/ui';
import { Star, MessageSquare, Shield, LayoutDashboard, LogOut } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function ProfileClient({ data }) {
    const { user, myReviews: initialMyReviews, mySubmittedBusinesses } = data;
    const myReviews = initialMyReviews.filter(r => !r.is_deleted);
    const [activeTab, setActiveTab] = useState('reviews');

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <Card className="p-8 mb-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10"></div>

                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold text-3xl mx-auto mb-4 border-4 border-white shadow-md overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                user.name.charAt(0).toUpperCase()
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                        <p className="text-slate-700 font-medium">{user.email}</p>

                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            {(user.role === 'Owner' || user.role === 'Super Admin') && (
                                <Link href="/dashboard">
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                                        <LayoutDashboard className="w-4 h-4" />
                                        Business Dashboard
                                    </Button>
                                </Link>
                            )}

                            {user.role === 'Super Admin' && (
                                <Link href="/admin">
                                    <Button variant="outline" className="gap-2">
                                        <Shield className="w-4 h-4" />
                                        Admin Panel
                                    </Button>
                                </Link>
                            )}
                        </div>

                        <div className="mt-8 flex justify-center gap-8 text-sm text-slate-600 border-t border-slate-100 pt-6">
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-xl text-slate-900">{myReviews.length}</span>
                                <span className="flex items-center gap-1 text-slate-500">
                                    <MessageSquare className="w-3 h-3" /> Reviews
                                </span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className={`font-bold text-xl capitalize ${user.account_status === 'active' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {user.account_status || 'Active'}
                                </span>
                                <span className="text-slate-700 font-medium">Status</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 mb-6">
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'reviews'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Reviews
                    </button>
                    <button
                        onClick={() => setActiveTab('businesses')}
                        className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'businesses'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Businesses
                    </button>
                </div>

                <div className="space-y-6">
                    {activeTab === 'reviews' && (
                        <>
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-900">My Reviews</h2>
                                <Link href="/search">
                                    <Button variant="outline" size="sm">Write a Review</Button>
                                </Link>
                            </div>

                            {myReviews.length > 0 ? (
                                <div className="space-y-4">
                                    {myReviews.map((review) => (
                                        <Card key={review._id} className="p-6 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-900">
                                                        {review.business_id?.name || 'Unknown Business'}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`w-4 h-4 ${i < review.overall_rating
                                                                        ? 'text-yellow-400 fill-current'
                                                                        : 'text-gray-300'
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-900 ml-1">
                                                            {review.overall_rating.toFixed(1)}
                                                        </span>
                                                        <span className="text-sm text-slate-700 font-medium ml-2 border-l border-slate-300 pl-2">
                                                            {new Date(review.createdAt).toLocaleDateString()}
                                                        </span>
                                                        {review.is_deleted && (
                                                            <span className="ml-2 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold uppercase">
                                                                Deleted
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Link href={`/business/${review.business_id?._id}`}>
                                                    <Button size="sm" variant="outline">View</Button>
                                                </Link>
                                            </div>
                                            <p className="text-gray-900 line-clamp-3">{review.text_content}</p>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="p-12 text-center">
                                    <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Reviews Yet</h3>
                                    <p className="text-slate-600 mb-6">Share your experiences to help others discover great businesses.</p>
                                    <Link href="/search">
                                        <Button>Browse Businesses</Button>
                                    </Link>
                                </Card>
                            )}
                        </>
                    )}

                    {activeTab === 'businesses' && (
                        <div className="space-y-8">
                            {/* Submitted Businesses */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Submitted Businesses</h3>
                                {mySubmittedBusinesses && mySubmittedBusinesses.length > 0 ? (
                                    <div className="space-y-4">
                                        {mySubmittedBusinesses.map((business) => (
                                            <Card key={business._id} className="p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{business.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${business.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                            business.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                            {business.status}
                                                        </span>
                                                        <span className="text-sm text-slate-500">{business.category}</span>
                                                    </div>
                                                </div>
                                                <Link href={`/business/${business._id}`}>
                                                    <Button size="sm" variant="outline">View</Button>
                                                </Link>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 italic">You haven't submitted any businesses yet.</p>
                                )}
                            </div>

                            {/* Reviewed Businesses (Derived from reviews) */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Reviewed Businesses</h3>
                                {myReviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {/* Deduplicate businesses from reviews */}
                                        {Array.from(new Set(myReviews.map(r => r.business_id?._id)))
                                            .map(id => myReviews.find(r => r.business_id?._id === id)?.business_id)
                                            .filter(Boolean)
                                            .map((business) => (
                                                <Card key={business._id} className="p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{business.name}</h4>
                                                        <span className="text-sm text-slate-500 capitalize">{business.category}</span>
                                                    </div>
                                                    <Link href={`/business/${business._id}`}>
                                                        <Button size="sm" variant="outline">View</Button>
                                                    </Link>
                                                </Card>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 italic">You haven't reviewed any businesses yet.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
