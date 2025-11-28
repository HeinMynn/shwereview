import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                S
                            </div>
                            <span className="font-bold text-xl text-white">ShweReview</span>
                        </div>
                        <p className="text-sm text-slate-400 max-w-xs">
                            Discover the best local businesses, read honest reviews, and share your own experiences with the community.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-4">Explore</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                            <li><Link href="/search" className="hover:text-white transition-colors">Browse Businesses</Link></li>
                            <li><Link href="/search?category=restaurant" className="hover:text-white transition-colors">Restaurants</Link></li>
                            <li><Link href="/search?category=shop" className="hover:text-white transition-colors">Shops</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-4">For Business</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/business/new" className="hover:text-white transition-colors">Add a Business</Link></li>
                            <li><Link href="/login" className="hover:text-white transition-colors">Business Login</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Claim your Business</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Business Support</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
                    <p>&copy; {new Date().getFullYear()} ShweReview. All rights reserved.</p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <Link href="#" className="hover:text-slate-300">Privacy Policy</Link>
                        <Link href="#" className="hover:text-slate-300">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
