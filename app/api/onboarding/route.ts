import { NextResponse } from 'next/server';
import { getSession } from '../../lib/session';
import { getSupabaseServerClient } from '../../lib/supabase';
import DOMPurify from 'isomorphic-dompurify';
import { technicalFormSchema, commercialFormSchema } from '../../lib/schemas';
import { evaluateBusinessProfile, generateProposal, sendProposalEmail } from '../../lib/api';
import { TECNOLOGICO_FORM, COMERCIAL_FORM } from '../../lib/formConfigs';
import { cookies } from 'next/headers';
import { rateLimit } from '../../lib/rate-limit';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const formType = searchParams.get('formType');

    if (session.role !== formType) {
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('onboarding_session')?.value || '';
    const supabase = getSupabaseServerClient(token);

    const { data, error } = await supabase
        .from('form_submissions')
        .select('answers')
        .eq('company_id', session.companyId)
        .eq('role', session.role)
        .single();

    if (error) {
        return NextResponse.json({ success: true, answers: [] });
    }

    let parsedAnswers: string[] = [];
    if (data && data.answers) {
        try {
            parsedAnswers = typeof data.answers === 'string' ? JSON.parse(data.answers) : data.answers;
        } catch (e) { }
    }

    return NextResponse.json({ success: true, answers: parsedAnswers });
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const isAllowed = await rateLimit(ip, { limit: 20, windowMs: 60 * 1000 });
    if (!isAllowed) {
        return NextResponse.json({ success: false, message: "Demasiadas peticiones. Por favor espere." }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { action, formType, answers } = body;

        if (!Array.isArray(answers)) {
            return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
        }

        const sanitizedAnswers = answers.map((a: string) => DOMPurify.sanitize(a, { ALLOWED_TAGS: [] }).slice(0, 5000));

        const cookieStore = await cookies();
        const token = cookieStore.get('onboarding_session')?.value || '';
        const supabase = getSupabaseServerClient(token);

        if (action === 'saveProgress') {
            if (session.role !== formType) return NextResponse.json({ success: false }, { status: 403 });

            const { error } = await supabase
                .from('form_submissions')
                .upsert({
                    company_id: session.companyId,
                    role: session.role,
                    answers: JSON.stringify(sanitizedAnswers),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'company_id, role' });

            if (error) {
                return NextResponse.json({ success: false, message: "Database Error" }, { status: 500 });
            }
            return NextResponse.json({ success: true });
        }

        if (action === 'submitForm') {
            if (session.role !== formType) return NextResponse.json({ success: false }, { status: 403 });

            let validation;
            if (formType === 'technical') {
                validation = technicalFormSchema.safeParse({ answers: sanitizedAnswers });
            } else {
                validation = commercialFormSchema.safeParse({ answers: sanitizedAnswers });
            }

            if (!validation.success) {
                return NextResponse.json({
                    success: false,
                    message: validation.error.issues[0]?.message || "Invalid answers",
                    fieldErrors: validation.error.flatten().fieldErrors
                }, { status: 400 });
            }

            const validAnswers = validation.data.answers;

            const { error } = await supabase
                .from('form_submissions')
                .upsert({
                    company_id: session.companyId,
                    role: session.role,
                    answers: JSON.stringify(validAnswers),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'company_id, role' });

            if (error) {
                return NextResponse.json({ success: false, message: "Database Error" }, { status: 500 });
            }

            return NextResponse.json({ success: true, status: 'next' });
        }

        if (action === 'finalize') {
            if (session.role !== 'commercial') return NextResponse.json({ success: false }, { status: 403 });

            await supabase
                .from('form_submissions')
                .upsert({
                    company_id: session.companyId,
                    role: session.role,
                    answers: JSON.stringify(sanitizedAnswers),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'company_id, role' });

            const { data: techData, error: techError } = await supabase
                .from('form_submissions')
                .select('answers')
                .eq('company_id', session.companyId)
                .eq('role', 'technical')
                .single();

            if (techError || !techData || !techData.answers) {
                return NextResponse.json({ success: false, message: "Faltan respuestas del perfil técnico." }, { status: 400 });
            }

            let techAnswers: string[] = [];
            try {
                techAnswers = typeof techData.answers === 'string' ? JSON.parse(techData.answers) : techData.answers;
            } catch (e) { }

            if (!Array.isArray(techAnswers) || techAnswers.length < 13) {
                return NextResponse.json({ success: false, message: "El formulario técnico está incompleto." }, { status: 400 });
            }
            if (sanitizedAnswers.length < 27) {
                return NextResponse.json({ success: false, message: "El formulario comercial está incompleto." }, { status: 400 });
            }

            const commercialQuestions = COMERCIAL_FORM.questions;
            const technicalQuestions = TECNOLOGICO_FORM.questions;

            const evaluationResult = await evaluateBusinessProfile(
                sanitizedAnswers,
                commercialQuestions,
                techAnswers,
                technicalQuestions
            );

            if (evaluationResult.status !== "next") {
                return NextResponse.json({ success: true, status: 'decline' });
            }

            const proposalResult = await generateProposal(
                sanitizedAnswers,
                commercialQuestions,
                techAnswers,
                technicalQuestions
            );

            if (!proposalResult.url) {
                return NextResponse.json({ success: false, message: "Error al generar la propuesta PDF" }, { status: 500 });
            }

            const { data: companyData, error: companyError } = await supabase
                .from('companies')
                .select('contact_email, contact_name')
                .eq('id', session.companyId)
                .single();

            if (companyError || !companyData || !companyData.contact_email) {
                return NextResponse.json({ success: false, message: "No se encontró email de contacto." }, { status: 500 });
            }

            const formName = sanitizedAnswers[0] || companyData.contact_name || "Cliente";

            await sendProposalEmail({
                recipientEmail: companyData.contact_email,
                recipientName: formName,
                pdfUrl: proposalResult.url
            });

            return NextResponse.json({ success: true, status: 'next', pdfUrl: proposalResult.url });
        }

        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    } catch (e) {
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
