import { Skeleton } from "@/components/ui"
import { Search, Filter } from 'lucide-react'

export default function SearchLoading() {
    return (
        <main className="min-h-screen bg-slate-50 pb-12">
            {/* Search Header Skeleton */}
            <div className="bg-white border-b border-slate-200 sticky top-16 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-200 w-5 h-5" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                        <Skeleton className="h-10 w-20 rounded-md" />
                    </div>

                    {/* Filters Skeleton */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 overflow-x-auto pb-2">
                        <div className="flex items-center text-sm font-medium text-gray-300 mr-2">
                            <Filter className="w-4 h-4 mr-1" /> Filters:
                        </div>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-7 w-20 rounded-full" />
                            ))}
                        </div>
                        <div className="w-px h-6 bg-gray-100 mx-2 hidden sm:block"></div>
                        <div className="flex gap-2">
                            {[1, 2].map((i) => (
                                <Skeleton key={i} className="h-7 w-16 rounded-full" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Skeleton */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex justify-between items-end">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-32" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden h-full flex flex-col">
                            <Skeleton className="h-48 w-full" />
                            <div className="p-4 flex-1 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}
