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
                featuredCategories: [
                    { name: 'Restaurants', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop', count: '1,200+' },
                    { name: 'Hotels', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop', count: '800+' },
                    { name: 'Shopping', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop', count: '2,500+' },
                    { name: 'Services', image: 'https://images.unsplash.com/photo-1521791136064-7985c2d18854?q=80&w=800&auto=format&fit=crop', count: '1,500+' },
                ],
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
