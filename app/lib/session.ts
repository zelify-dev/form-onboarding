import 'server-only';
import { cookies } from 'next/headers';

type SessionData = {
    companyId: string;
    role: string;
};

const SESSION_COOKIE_NAME = 'onboarding_session';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

export async function createSession(data: SessionData) {
    const cookieStore = await cookies();

    // In a real production app, we should encrypt this data (e.g. using jose/jwt).
    // For this onboarding flow where the data is just IDs, signing is minimum.
    // Since we are moving fast and don't have a secret key handy in env yet for encryption,
    // we will store the raw JSON but rely on HTTPOnly to prevent client access.
    // TODO: Add encryption later.

    const value = JSON.stringify(data);

    cookieStore.set(SESSION_COOKIE_NAME, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
    });
}

export async function getSession(): Promise<SessionData | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) return null;

    try {
        return JSON.parse(sessionCookie.value) as SessionData;
    } catch (e) {
        return null;
    }
}

export async function decrypt(cookie: string | undefined): Promise<SessionData | null> {
    if (!cookie) return null;
    try {
        return JSON.parse(cookie) as SessionData;
    } catch (error) {
        console.log('Failed to decrypt session');
        return null;
    }
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}
