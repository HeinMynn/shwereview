'use client';

import { Check } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import Link from 'next/link';

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                    Simple, transparent pricing
                </h2>
                <p className="mt-4 text-xl text-slate-600">
                    Choose the plan that's right for your business.
                </p>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-12 max-w-4xl mx-auto">
                {/* Free Tier */}
                <Card className="p-8 flex flex-col relative">
                    <div className="mb-4">
                        <h3 className="text-2xl font-bold text-slate-900">Free</h3>
                        <p className="mt-2 text-slate-600">Essential features to get started.</p>
                    </div>
                    <div className="mb-8">
                        <span className="text-4xl font-extrabold text-slate-900">$0</span>
                        <span className="text-slate-600">/month</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-center">
                            <Check className="w-5 h-5 text-green-500 mr-3" />
                            <span className="text-slate-700">Claim & Verify Business</span>
                        </li>
                        <li className="flex items-center">
                            <Check className="w-5 h-5 text-green-500 mr-3" />
                            <span className="text-slate-700">Update Basic Info</span>
                        </li>
                        <li className="flex items-center">
                            <Check className="w-5 h-5 text-green-500 mr-3" />
                            <span className="text-slate-700">Respond to Reviews</span>
                        </li>
                        <li className="flex items-center">
                            <Check className="w-5 h-5 text-green-500 mr-3" />
                            <span className="text-slate-700">Standard Support</span>
                        </li>
                    </ul>
                    <Link href="/business/new" className="w-full">
                        <Button variant="outline" className="w-full">Get Started</Button>
                    </Link>
                </Card>

                {/* Pro Tier */}
                <Card className="p-8 flex flex-col relative border-indigo-600 border-2 shadow-xl">
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wide">
                        Popular
                    </div>
                    <div className="mb-4">
                        <h3 className="text-2xl font-bold text-slate-900">Pro</h3>
                        <p className="mt-2 text-slate-600">Power up your business profile.</p>
                    </div>
                    <div className="mb-8">
                        <span className="text-4xl font-extrabold text-slate-900">$20</span>
                        <span className="text-slate-600">/month</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-center">
                            <Check className="w-5 h-5 text-indigo-600 mr-3" />
                            <span className="text-slate-900 font-medium">Everything in Free, plus:</span>
                        </li>
                        <li className="flex items-center">
                            <Check className="w-5 h-5 text-indigo-600 mr-3" />
                            <span className="text-slate-700">Verified Gold Badge</span>
                        </li>
                        <li className="flex items-center">
                            <Check className="w-5 h-5 text-indigo-600 mr-3" />
                            <span className="text-slate-700">Custom Call-to-Action Button</span>
                        </li>
                        <li className="flex items-center">
                            <Check className="w-5 h-5 text-indigo-600 mr-3" />
                            <span className="text-slate-700">Advanced Analytics</span>
                        </li>
                        <li className="flex items-center">
                            <Check className="w-5 h-5 text-indigo-600 mr-3" />
                            <span className="text-slate-700">Priority Support</span>
                        </li>
                    </ul>
                    <Link href="/checkout?plan=pro" className="w-full">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Upgrade to Pro</Button>
                    </Link>
                </Card>
            </div>
        </div>
    );
}
