import { NextResponse } from 'next/server';
import { accessCodeSchema } from '../../../lib/schemas';
import { getSupabaseAdmin } from '../../../lib/supabase';
import { rateLimit } from '../../../lib/rate-limit';
import { createSession } from '../../../lib/session';

export async function POST(request: Request) {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    await sleep(Math.floor(Math.random() * 200) + 50);

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const isAllowed = await rateLimit(ip, { limit: 5, windowMs: 60 * 1000 });
    if (!isAllowed) {
        return NextResponse.json({ success: false, message: "Demasiados intentos. Por favor espere 1 minuto." }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { code, role } = body;

        if (!role || (role !== 'technical' && role !== 'commercial')) {
            return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
        }

        const validation = accessCodeSchema.safeParse({ code });
        if (!validation.success) {
            return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
        }

        const cleanCode = validation.data.code;
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from('access_codes')
            .select('role, company_id')
            .eq('code', cleanCode)
            .eq('is_active', true)
            .single();

        if (error || !data || data.role !== role) {
            return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
        }

        const userAgent = request.headers.get('user-agent') || 'unknown';
        await createSession({
            companyId: data.company_id,
            role: data.role,
            ip,
            userAgent
        });

        return NextResponse.json({ success: true, role: data.role });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
