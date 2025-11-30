import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;

    // Paths that should not be accessible if logged in
    const authPaths = ['/login', '/register'];

    if (authPaths.includes(pathname)) {
        if (token) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/login', '/register'],
};
