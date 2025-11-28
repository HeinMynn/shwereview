import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User, Business, Review } from '@/lib/models';
import bcrypt from 'bcryptjs';

export async function POST() {
    try {
        await dbConnect();

        // Clear existing data
        await User.deleteMany({});
        await Business.deleteMany({});
        await Review.deleteMany({});

        const passwordHash = await bcrypt.hash('password123', 10);

        // Create Super Admin
        const admin = await User.create({
            name: 'Super Admin',
            email: 'admin@example.com',
            password_hash: passwordHash,
            role: 'Super Admin',
            badges: ['Admin'],
        });

        // Create Users
        const owner = await User.create({
            name: 'Alice Owner',
            email: 'alice@example.com',
            password_hash: passwordHash,
            role: 'Owner',
            badges: ['Verified Owner'],
        });

        const user1 = await User.create({
            name: 'Bob Foodie',
            email: 'bob@example.com',
            password_hash: passwordHash,
            role: 'User',
            badges: ['Top Foodie'],
        });

        const user2 = await User.create({
            name: 'Charlie Shopper',
            email: 'charlie@example.com',
            password_hash: passwordHash,
            role: 'User',
            badges: [],
        });

        // Create Businesses
        const restaurant = await Business.create({
            name: 'The Gourmet Spot',
            description: 'Fine dining experience with modern twists.',
            address: '123 Culinary Ave',
            category: 'restaurant',
            owner_id: owner._id,
            submitted_by: owner._id,
            is_verified: true,
            status: 'approved',
            claim_status: 'unclaimed',
            images: ['https://placehold.co/600x400/orange/white?text=Restaurant'],
        });

        const logistics = await Business.create({
            name: 'FastTrack Logistics',
            description: 'Reliable shipping and handling.',
            address: '456 Industrial Blvd',
            category: 'logistics',
            owner_id: owner._id,
            submitted_by: owner._id,
            is_verified: true,
            status: 'approved',
            claim_status: 'unclaimed',
            images: ['https://placehold.co/600x400/blue/white?text=Logistics'],
        });

        const shop = await Business.create({
            name: 'Yangon Supermarket',
            description: 'Best grocery store in town.',
            address: '456 Pyay Road, Yangon',
            category: 'shop',
            owner_id: owner._id,
            submitted_by: owner._id,
            is_verified: true,
            status: 'approved',
            claim_status: 'unclaimed',
            images: ['https://placehold.co/600x400/purple/white?text=Shop'],
        });

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully',
            data: { admin, owner, users: [user1, user2], businesses: [restaurant, logistics, shop] }
        });
    } catch (error) {
        console.error('Error seeding database:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
