import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import dbConnect from '@/lib/mongodb';
import { User, Review } from '@/lib/models';
import { Card, Button } from '@/components/ui';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';

import AdminUserControls from '@/components/AdminUserControls';

export default async function AdminUserDetail({ params }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'Super Admin') {
        redirect('/');
    }

    await dbConnect();
    const { id } = await params;

    const user = await User.findById(id).lean();
    if (!user) {
        return <div className="p-8">User not found</div>;
    }

    const reviews = await Review.find({ user_id: id })
        .populate('business_id', 'name')
        .sort({ createdAt: -1 })
        .lean();

    return (
        <main className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/admin" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">User Details</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">Profile</h2>
                        <div className="space-y-2">
                            <div>
                                <label className="text-sm text-gray-500">Name</label>
                                <div className="font-bold text-lg flex items-center gap-2">
                                    {user.name}
                                    {user.phone_verified && (
                                        <VerifiedBadge />
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Email</label>
                                <div className="font-bold text-lg">{user.email}</div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Role</label>
                                <div className="font-bold capitalize">{user.role}</div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Joined</label>
                                <div className="font-bold">{new Date(user.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">Moderation</h2>
                        <AdminUserControls user={JSON.parse(JSON.stringify(user))} />
                    </Card>
                </div>

                <h2 className="text-2xl font-bold mb-4">Review History ({reviews.length})</h2>

                {reviews.length > 0 ? (
                    <div className="space-y-4">
                        {reviews.map(review => (
                            <Card key={review._id} className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <Link href={`/business/${review.business_id?._id}`} className="font-bold text-lg hover:underline text-blue-600">
                                            {review.business_id?.name || 'Unknown Business'}
                                        </Link>
                                        <div className="text-sm text-gray-500">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                            {review.is_edited && <span className="italic ml-1">(edited)</span>}
                                            {review.is_anonymous && <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">Anonymous</span>}
                                        </div>
                                    </div>
                                    <div className="bg-slate-100 px-3 py-1 rounded font-bold flex items-center gap-1">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        {review.overall_rating.toFixed(1)}
                                    </div>
                                </div>
                                <p className="text-gray-700">{review.text_content}</p>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">This user has not submitted any reviews.</p>
                )}
            </div>
        </main>
    );
}
