import Link from 'next/link';
import { Shield, FileText } from 'lucide-react';

export default function TermsOfService() {
    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-indigo-600 p-8 text-center">
                    <FileText className="w-16 h-16 text-white mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
                    <p className="text-indigo-100 text-lg">Last Updated: November 2025</p>
                </div>

                <div className="p-8 space-y-8 text-gray-700">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using ShweReview, you agree to be bound by these Terms of Service and our Community Guidelines. If you do not agree, please do not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">2. User Conduct</h2>
                        <p className="mb-2">You agree not to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Post false, misleading, or defamatory content.</li>
                            <li>Harass, threaten, or intimidate other users.</li>
                            <li>Use the platform for any illegal purpose.</li>
                            <li>Attempt to manipulate ratings or reviews.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">3. Content Ownership & Liability</h2>
                        <p className="mb-2">
                            Users retain ownership of the content they post but grant ShweReview a license to use, display, and distribute it.
                        </p>
                        <p>
                            <strong>ShweReview is not liable for user-generated content.</strong> We do not endorse any opinions expressed by users. We reserve the right to remove content that violates our policies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">4. Account Termination</h2>
                        <p>
                            We reserve the right to suspend or terminate accounts that violate these terms or our Community Guidelines without prior notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">5. Disclaimers</h2>
                        <p>
                            The service is provided "as is" without warranties of any kind. We do not guarantee the accuracy or completeness of any business information or reviews.
                        </p>
                    </section>

                    <div className="text-center pt-8 border-t border-slate-100">
                        <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
                            &larr; Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
