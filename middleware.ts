import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './app/lib/session';

export async function middleware(request: NextRequest) {
    // 1. Define protected routes
    const protectedRoutes = ['/tecnologico', '/comercial'];
    const currentPath = request.nextUrl.pathname;

    const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));

    if (isProtectedRoute) {
        // 2. Check for session cookie
        const cookie = request.cookies.get('onboarding_session')?.value;
        const session = await decrypt(cookie);

        // 3. If no valid session, redirect to login
        if (!session?.companyId) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // 4. Device Fingerprinting Check
        const currentIp = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const currentUserAgent = request.headers.get('user-agent') || 'unknown';

        if (session.ip !== currentIp || session.userAgent !== currentUserAgent) {
            console.warn(`[Security] Fingerprint validation failed. Hijacking detected or network changed.`);
            const response = NextResponse.redirect(new URL('/', request.url));
            response.cookies.delete('onboarding_session');
            return response;
        }

        // 5. Role Validation (Optional but recommended)
        // Ensure commercial role can't access /tecnologico if we want strict separation
        if (currentPath.startsWith('/tecnologico') && session.role !== 'technical') {
            // Redirect to their correct page or home?
            // For now, let's just redirect to home to be safe/simple
            return NextResponse.redirect(new URL('/', request.url));
        }
        if (currentPath.startsWith('/comercial') && session.role !== 'commercial') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/tecnologico/:path*', '/comercial/:path*'],
};
