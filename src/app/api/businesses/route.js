import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const body = await request.json();
        const { name, description, address, category } = body;

        // Validate required fields
        if (!name || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const processedImages = [];

        // Handle multiple images
        if (body.images && Array.isArray(body.images) && body.images.length > 0) {
            for (const img of body.images) {
                try {
                    const uploadResponse = await cloudinary.uploader.upload(img, {
                        folder: 'shwereview/businesses',
                    });
                    processedImages.push(uploadResponse.secure_url);
                } catch (uploadError) {
                    console.error('Cloudinary upload failed:', uploadError);
                    // Skip failed uploads
                }
            }
        }

        // Fallback placeholder if no images uploaded successfully
        if (processedImages.length === 0) {
            processedImages.push(`https://placehold.co/600x400/gray/white?text=${encodeURIComponent(name)}`);
        }

        const business = await Business.create({
            name,
            description,
            address,
            category,
            owner_id: null, // Unclaimed initially
            submitted_by: session.user.id,
            status: 'pending',
            claim_status: 'unclaimed',
            is_verified: false,
            images: processedImages,
            geo_coordinates: body.geo_coordinates,
            tags: body.tags || [],
        });

        return NextResponse.json({ success: true, business });
    } catch (error) {
        console.error('Error creating business:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
