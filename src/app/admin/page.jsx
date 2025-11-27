import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AdminDashboardClient from '@/components/AdminDashboardClient';
import dbConnect from '@/lib/mongodb';
import { User, Business } from '@/lib/models';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Super Admin') {
        redirect('/');
    }

    await dbConnect();

    // Fetch data directly from DB
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    const businesses = await Business.find({}).populate('owner_id', 'name email').sort({ createdAt: -1 }).lean();

    // Serialize data to pass to client component
    const serializedUsers = JSON.parse(JSON.stringify(users));
    const serializedBusinesses = JSON.parse(JSON.stringify(businesses));

    return (
        <AdminDashboardClient
            initialUsers={serializedUsers}
            initialBusinesses={serializedBusinesses}
        />
    );
}
