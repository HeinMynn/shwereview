import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import RegisterForm from '@/components/auth/RegisterForm';

export default async function RegisterPage() {
    const session = await getServerSession(authOptions);

    if (session) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <RegisterForm />
        </div>
    );
}
