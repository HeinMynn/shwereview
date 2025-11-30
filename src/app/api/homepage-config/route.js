import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { HomepageConfig } from '@/lib/models';

export const revalidate = 60; // Revalidate every minute

export async function GET() {
    try {
        await dbConnect();
        let config = await HomepageConfig.findOne().sort({ createdAt: -1 });

        if (!config) {
            // Return default structure if no config exists
            return NextResponse.json({
                hero: {
                    title: 'Discover & Review Local Businesses',
                    subtitle: 'Find trusted businesses in Myanmar.',
                    backgroundImage: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=2000&auto=format&fit=crop',
                    searchPlaceholder: 'Search for restaurants, hotels, services...'
                },
                stats: [
                    { label: 'Businesses Listed', value: '2,500+', icon: 'MapPin' },
                    { label: 'Active Users', value: '50k+', icon: 'Users' },
                    { label: 'Reviews Written', value: '125k+', icon: 'FileText' },
                    { label: 'Cities Covered', value: '75+', icon: 'Globe' }
                ],
                featuredCategories: [], // Will fallback to dynamic categories
                cta: {
                    title: 'Grow Your Business with ShweReview',
                    subtitle: 'Claim your business profile, respond to reviews, and reach thousands of potential customers.',
                    buttonText: 'List Your Business'
                }
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Fetch homepage config error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
