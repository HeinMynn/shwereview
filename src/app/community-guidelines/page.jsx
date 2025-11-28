import Link from 'next/link';
import { Shield, Heart, MessageCircle, AlertTriangle } from 'lucide-react';

export default function CommunityGuidelines() {
    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-indigo-600 p-8 text-center">
                    <Shield className="w-16 h-16 text-white mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">Community Guidelines</h1>
                    <p className="text-indigo-100 text-lg">Helping keep ShweReview helpful, safe, and honest.</p>
                </div>

                <div className="p-8 space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Heart className="w-6 h-6 text-red-500" />
                            Be Respectful
                        </h2>
                        <p className="text-gray-600 mb-4">
                            ShweReview is a community of real people. We expect everyone to treat each other with respect.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600">
                            <li><strong>No Hate Speech:</strong> We have zero tolerance for hate speech, discrimination, or harassment based on race, ethnicity, religion, gender, sexual orientation, disability, or disease.</li>
                            <li><strong>No Harassment:</strong> Do not bully, threaten, or harass business owners or other reviewers.</li>
                            <li><strong>Keep it Clean:</strong> Avoid profanity, obscenity, and sexually explicit content.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <MessageCircle className="w-6 h-6 text-blue-500" />
                            Be Honest and Authentic
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Your reviews help others make informed decisions. Authenticity is key.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600">
                            <li><strong>Personal Experience:</strong> Only review businesses you have personally visited or used.</li>
                            <li><strong>No Conflicts of Interest:</strong> Do not review your own business, your employer's business, or a competitor's business.</li>
                            <li><strong>No Paid Reviews:</strong> Do not accept money, gifts, or discounts in exchange for a positive review.</li>
                            <li><strong>Accuracy:</strong> Ensure your review is factually accurate. Do not exaggerate or misrepresent your experience.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-yellow-500" />
                            Consequences of Violations
                        </h2>
                        <p className="text-gray-600 mb-4">
                            We take these guidelines seriously. Violations may result in:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600">
                            <li><strong>Content Removal:</strong> Reviews that violate our policies will be hidden or removed.</li>
                            <li><strong>Account Warnings:</strong> Users may receive warnings for minor or first-time offenses.</li>
                            <li><strong>Account Suspension:</strong> Repeated violations or serious offenses may lead to temporary suspension.</li>
                            <li><strong>Permanent Ban:</strong> Severe or persistent violations will result in a permanent ban from the platform.</li>
                        </ul>
                    </section>

                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mt-8">
                        <h3 className="font-bold text-slate-900 mb-2">Reporting Violations</h3>
                        <p className="text-gray-600">
                            If you see a review or user that violates these guidelines, please use the "Report" flag icon on the review to alert our moderation team.
                        </p>
                    </div>

                    <div className="text-center pt-8">
                        <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
                            &larr; Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
