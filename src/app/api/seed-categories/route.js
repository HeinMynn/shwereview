import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Category } from '@/lib/models';

export async function GET() {
    try {
        await dbConnect();

        const categories = [
            {
                name: 'Food & Dining',
                slug: 'food-dining',
                icon: 'Utensils',
                subcategories: ['Restaurant', 'Cafe & Tea House', 'Street Food', 'Bakery & Dessert', 'Bar & Nightlife']
            },
            {
                name: 'Shopping',
                slug: 'shopping',
                icon: 'ShoppingBag',
                subcategories: ['Fashion & Clothing', 'Electronics', 'Groceries', 'Home & Garden', 'Beauty & Health', 'Jewelry & Gold']
            },
            {
                name: 'Beauty & Wellness',
                slug: 'beauty-wellness',
                icon: 'Sparkles',
                subcategories: ['Salon', 'Spa & Massage', 'Gym & Fitness', 'Clinic & Medical']
            },
            {
                name: 'Hospitality & Travel',
                slug: 'hospitality-travel',
                icon: 'Hotel',
                subcategories: ['Hotel', 'Hostel / Guesthouse', 'Travel Agency', 'Car Rental']
            },
            {
                name: 'Education',
                slug: 'education',
                icon: 'GraduationCap',
                subcategories: ['School', 'University / College', 'Training Center', 'Tutor']
            },
            {
                name: 'Services',
                slug: 'services',
                icon: 'Wrench',
                subcategories: ['Automotive', 'Logistics', 'Cleaning', 'Legal & Financial', 'Real Estate', 'Photography']
            },
            {
                name: 'Entertainment',
                slug: 'entertainment',
                icon: 'Film',
                subcategories: ['Cinema', 'Playground / Kids', 'Event Center', 'Gaming / Internet Cafe']
            }
        ];

        // Clear existing categories to avoid duplicates/conflicts during development
        await Category.deleteMany({});

        // Insert new categories
        await Category.insertMany(categories);

        return NextResponse.json({ success: true, message: 'Categories seeded successfully', count: categories.length });
    } catch (error) {
        console.error('Error seeding categories:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
