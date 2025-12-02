import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import { Business } from '@/lib/models';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'Super Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { businessId, updates } = await req.json();

        if (!businessId || !updates) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Handle Image Uploads
        let processedImages = [];
        if (updates.images && Array.isArray(updates.images)) {
            console.log(`Processing ${updates.images.length} images for business ${businessId}`);
            for (const img of updates.images) {
                if (img.startsWith('data:image')) {
                    console.log('Found base64 image, uploading to Cloudinary...');
                    // Upload base64 to Cloudinary
                    try {
                        const uploadRes = await cloudinary.uploader.upload(img, {
                            folder: 'shwereview/businesses',
                        });
                        console.log('Upload success:', uploadRes.secure_url);
                        processedImages.push(uploadRes.secure_url);
                    } catch (uploadError) {
                        console.error('Image upload failed:', uploadError);
                        throw new Error(`Image upload failed: ${uploadError.message}`);
                    }
                } else {
                    console.log('Found existing URL, keeping it.');
                    // Keep existing URL
                    processedImages.push(img);
                }
            }
        }

        // Allowed fields to update
        const allowedUpdates = {};
        if (updates.name) allowedUpdates.name = updates.name;
        if (updates.description) allowedUpdates.description = updates.description;
        if (updates.address) allowedUpdates.address = updates.address;
        if (updates.category) allowedUpdates.category = updates.category;
        if (updates.geo_coordinates) allowedUpdates.geo_coordinates = updates.geo_coordinates;

        // Fix: Allow clearing images if explicit empty array is sent, or update if we have images
        if (updates.images && Array.isArray(updates.images)) {
            console.log('Updating images in DB with:', processedImages);
            allowedUpdates.images = processedImages;
        }

        const business = await Business.findByIdAndUpdate(
            businessId,
            { $set: allowedUpdates },
            { new: true }
        );

        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, business });
    } catch (error) {
        console.error('Update business error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
