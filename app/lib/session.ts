import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

type SessionData = {
    companyId: string;
    role: string;
    ip?: string;
    userAgent?: string;
};

const SESSION_COOKIE_NAME = 'onboarding_session';
/** Tiempo suficiente para formularios largos; se renueva en cada petición autenticada (getSession). */
const COOKIE_MAX_AGE = 60 * 120; // 2 horas

const getSecretKey = () => {
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("SUPABASE_JWT_SECRET environment variable is missing or too short. You need the JWT secret from your Supabase project settings.");
    }
    return new TextEncoder().encode(secret);
};

export async function createSession(data: SessionData) {
    const cookieStore = await cookies();

    const payload = {
        company_id: data.companyId,
        app_role: data.role,
        ip: data.ip,
        userAgent: data.userAgent
    };

    const value = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(getSecretKey());

    cookieStore.set(SESSION_COOKIE_NAME, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
    });
}

export async function getSession(): Promise<SessionData | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) return null;

    try {
        const { payload } = await jwtVerify(sessionCookie.value, getSecretKey(), {
            algorithms: ['HS256'],
        });

        const data: SessionData = {
            companyId: payload.company_id as string,
            role: payload.app_role as string,
            ip: payload.ip as string,
            userAgent: payload.userAgent as string,
        };
        // Ventana deslizante: cada GET/POST autenticado extiende la cookie (evita 401 al finalizar tras pausas).
        await createSession(data);
        return data;
    } catch (e) {
        return null; // Token expired or invalid signature
    }
}

export async function decrypt(cookie: string | undefined): Promise<SessionData | null> {
    if (!cookie) return null;
    try {
        const { payload } = await jwtVerify(cookie, getSecretKey(), {
            algorithms: ['HS256'],
        });
        return {
            companyId: payload.company_id as string,
            role: payload.app_role as string,
            ip: payload.ip as string,
            userAgent: payload.userAgent as string,
        };
    } catch (error) {
        return null; // Token expired or invalid signature
    }
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}
