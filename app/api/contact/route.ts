import { NextResponse } from 'next/server';
import { contactFormSchema } from '../../lib/schemas';
import { getSupabaseAdmin } from '../../lib/supabase';
import { sendAccessRequestEmail } from '../../lib/api';
import { rateLimit } from '../../lib/rate-limit';

export async function POST(request: Request) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const isAllowed = await rateLimit(ip, { limit: 2, windowMs: 60 * 1000 });
    if (!isAllowed) {
        return NextResponse.json({ success: false, message: "Demasiados intentos. Por favor espere." }, { status: 429 });
    }

    try {
        const body = await request.json();
        const validation = contactFormSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                success: false,
                message: "Datos inválidos",
                fieldErrors: validation.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const cleanData = validation.data;
        const supabase = getSupabaseAdmin();

        const { data: codesData, error: codesError } = await supabase.rpc(
            'register_company_and_get_codes',
            {
                _company_name: cleanData.company,
                _contact_email: cleanData.email,
                _contact_name: cleanData.name
            }
        );

        if (codesError || !codesData) {
            return NextResponse.json({ success: false, message: "Error al registrar la compañía" }, { status: 500 });
        }

        const { commercial_code, technical_code } = codesData;

        try {
            await sendAccessRequestEmail({
                name: cleanData.name,
                email: cleanData.email,
                phone: cleanData.phone,
                company: cleanData.company,
                role: cleanData.role,
                commercialCode: commercial_code,
                technicalCode: technical_code
            });
        } catch (emailError) {
            return NextResponse.json({ success: false, message: "Error enviando el correo" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Solicitud enviada con éxito." });
    } catch (e) {
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
