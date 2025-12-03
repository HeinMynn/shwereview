import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-900/20">
                                S
                            </div>
                            <span className="font-bold text-2xl text-white tracking-tight">ShweReview</span>
                        </div>
                        <p className="text-slate-400 max-w-sm leading-relaxed text-lg">
                            Discover the best local businesses, read honest reviews, and share your own experiences with the community.
                        </p>
                        <div className="mt-8 flex gap-4">
                            {/* Social Icons Placeholder */}
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all cursor-pointer">
                                    <span className="text-xs">Soc</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">Explore</h3>
                        <ul className="space-y-4">
                            <li><Link href="/" className="hover:text-indigo-400 transition-colors">Home</Link></li>
                            <li><Link href="/search" className="hover:text-indigo-400 transition-colors">Browse Businesses</Link></li>
                            <li><Link href="/search?category=restaurant" className="hover:text-indigo-400 transition-colors">Restaurants</Link></li>
                            <li><Link href="/search?category=shop" className="hover:text-indigo-400 transition-colors">Shops</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">For Business</h3>
                        <ul className="space-y-4">
                            <li><Link href="/business/new" className="hover:text-indigo-400 transition-colors">Add a Business</Link></li>
                            <li><Link href="/pricing" className="hover:text-indigo-400 transition-colors">Pricing</Link></li>
                            <li><Link href="/login" className="hover:text-indigo-400 transition-colors">Business Login</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Claim your Business</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Business Support</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-4 md:mb-0">
                        <p>&copy; {new Date().getFullYear()} ShweReview. All rights reserved.</p>
                    </div>
                    <div className="flex gap-6">
                        <Link href="/community-guidelines" className="hover:text-slate-300 transition-colors">Community Guidelines</Link>
                        <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
