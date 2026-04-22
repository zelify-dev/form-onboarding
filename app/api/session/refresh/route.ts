import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';

/**
 * Renueva la cookie de sesión (getSession emite un JWT nuevo).
 * Usado por heartbeat en el cliente y antes de finalizar/enviar.
 */
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json(
            { ok: false, message: 'Sesión expirada o no válida.' },
            { status: 401 }
        );
    }
    return NextResponse.json({ ok: true });
}
