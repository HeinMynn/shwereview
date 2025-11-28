import Link from 'next/link';
import { Lock, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-indigo-600 p-8 text-center">
                    <Lock className="w-16 h-16 text-white mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
                    <p className="text-indigo-100 text-lg">Your privacy matters to us.</p>
                </div>

                <div className="p-8 space-y-8 text-gray-700">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Account Information:</strong> Name, email address, and profile picture.</li>
                            <li><strong>User Content:</strong> Reviews, photos, and comments you post.</li>
                            <li><strong>Usage Data:</strong> Information about how you interact with our platform.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">2. How We Use Your Information</h2>
                        <p>We use your data to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide and improve our services.</li>
                            <li>Personalize your experience.</li>
                            <li>Communicate with you about updates and security.</li>
                            <li>Ensure platform safety and compliance.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">3. Data Sharing</h2>
                        <p>
                            We do not sell your personal data. We may share data with service providers who help us operate our platform or when required by law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">4. Data Security</h2>
                        <p>
                            We implement reasonable security measures to protect your information. However, no method of transmission over the internet is 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">5. Contact Us</h2>
                        <p>
                            If you have questions about this policy, please contact us at privacy@shwereview.com.
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
