/**
 * Pide al servidor renovar la cookie httpOnly (misma lógica que otras rutas autenticadas).
 */
export async function refreshOnboardingSession(): Promise<boolean> {
    try {
        const res = await fetch('/api/session/refresh', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
        });
        return res.ok;
    } catch {
        return false;
    }
}
