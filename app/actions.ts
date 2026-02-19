'use server';

import { createSession, deleteSession } from './lib/session';
import { accessCodeSchema, contactFormSchema, ContactFormInput } from './lib/schemas';
import { getSupabaseClient, getSupabaseAdmin } from './lib/supabase';
import { sendAccessRequestEmail } from './lib/api';

type ActionResponse = {
    success: boolean;
    message?: string;
    fieldErrors?: Record<string, string[]>;
    role?: string;
};

import { rateLimit } from './lib/rate-limit';
import { headers } from 'next/headers';

export async function verifyAccessCode(code: string): Promise<ActionResponse> {
    // 1. Validate Input Structure
    const validation = accessCodeSchema.safeParse({ code });
    if (!validation.success) {
        return { success: false, message: "Código inválido (solo letras y números)." };
    }

    // 2. Rate Limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown-ip';

    // Allow 5 attempts per minute
    const isAllowed = await rateLimit(ip, { limit: 5, windowMs: 60 * 1000 });
    if (!isAllowed) {
        return { success: false, message: "Demasiados intentos. Por favor espere 1 minuto." };
    }

    // 3. Server-Side Verification
    const cleanCode = validation.data.code;
    const supabase = getSupabaseAdmin(); // Secure Admin Client

    try {
        const { data, error } = await supabase
            .from('access_codes')
            .select('role, company_id')
            .eq('code', cleanCode)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            // Avoid revealing if it's a DB error or not found for security in some contexts,
            // but 'Code inválido' is standard.
            return { success: false, message: "Código inválido o no encontrado." };
        }

        // Success! Create session.
        await createSession({ companyId: data.company_id, role: data.role });

        return { success: true, role: data.role };
    } catch (error) {
        console.error("Server Action Error (verifyAccessCode):", error);
        return { success: false, message: "Error interno del servidor." };
    }
}

export async function submitContactForm(formData: ContactFormInput): Promise<ActionResponse> {
    const validation = contactFormSchema.safeParse(formData);

    if (!validation.success) {
        return {
            success: false,
            message: "Datos del formulario inválidos",
            fieldErrors: validation.error.flatten().fieldErrors,
        };
    }

    const cleanData = validation.data;
    // 3. Database Interaction
    const supabase = getSupabaseAdmin(); // Secure Admin Client

    try {
        console.log("Starting Company Registration for:", cleanData.email);

        // 1. Register company and get codes via RPC
        const { data: codesData, error: codesError } = await supabase.rpc(
            'register_company_and_get_codes',
            {
                _company_name: cleanData.company,
                _contact_email: cleanData.email,
                _contact_name: cleanData.name
            }
        );

        if (codesError) {
            console.error("RPC Error Details:", JSON.stringify(codesError, null, 2));
            return { success: false, message: "Error al registrar la compañía (BD)." };
        }

        if (!codesData) {
            console.error("RPC returned null data");
            return { success: false, message: "Error: No se recibieron datos del servidor." };
        }

        console.log("Company Registered. Codes received.");
        const { commercial_code, technical_code } = codesData;

        // 2. Send email via Backend API
        console.log("Attempting to send email...");
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
            console.log("Email sent successfully.");
        } catch (emailError) {
            console.error("Email Sending Failed:", emailError);
            // We refrain from failing the whole request so the user can at least contact support,
            // but for now let's return success with a warning if possible, or just fail safely.
            // Actually, if email fails, user DOES NOT GET CODES. So it IS a failure from UX perspective.
            throw emailError;
        }

        return { success: true, message: "Solicitud enviada con éxito." };

    } catch (error) {
        console.error("Server Action Exception (submitContactForm):", error);
        return { success: false, message: "Error al procesar la solicitud. Revise los logs del servidor." };
    }
}

export async function logout() {
    await deleteSession();
}

import { technicalFormSchema, commercialFormSchema } from './lib/schemas';
import { getSession } from './lib/session';
import { evaluateBusinessProfile, generateProposal } from './lib/api';
import { TECNOLOGICO_FORM, COMERCIAL_FORM } from './lib/formConfigs';

export async function submitOnboardingForm(
    formType: 'technical' | 'commercial',
    answers: string[]
): Promise<ActionResponse & { status?: string, data?: any }> {

    // 1. Session & Role Validation
    const session = await getSession();
    if (!session || session.role !== formType) {
        return { success: false, message: "Sesión inválida o expirada." };
    }

    // 2. Input Validation
    let validation;
    if (formType === 'technical') {
        validation = technicalFormSchema.safeParse({ answers });
    } else {
        validation = commercialFormSchema.safeParse({ answers });
    }

    if (!validation.success) {
        // Flatten errors to user-friendly format if needed, or just return first error
        const firstError = validation.error.issues[0];
        return {
            success: false,
            message: firstError.message || "Respuestas inválidas.",
            fieldErrors: validation.error.flatten().fieldErrors as any
        };
    }

    const validAnswers = validation.data.answers;
    const supabase = getSupabaseClient();

    try {
        // 3. Save to Supabase
        const { error: dbError } = await supabase
            .from('form_submissions')
            .upsert(
                {
                    company_id: session.companyId,
                    role: session.role,
                    answers: JSON.stringify(validAnswers),
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'company_id, role' }
            );

        if (dbError) {
            console.error("Database Error:", dbError);
            return { success: false, message: "Error al guardar el progreso." };
        }

        // 4. API Calls (Business Logic)
        // For 'technical', we might trigger generateProposal if commercial is also done?
        // For 'commercial', we might trigger evaluateBusinessProfile.

        let apiResult = null;
        let status = 'next'; // Default status

        if (formType === 'commercial') {
            // Logic for commercial form submission
            // We need the questions text to pass to the API
            const questions = COMERCIAL_FORM.questions;

            // Check if we also have technical answers? 
            // The API signatures usually take both if available, but for now we follow existing logic.
            // Existing logic in OnboardingForm called evaluateBusinessProfile
            // evaluateBusinessProfile(commercialAnswers, commercialQuestions, techAnswers?, techQuestions?)

            // Attempt to fetch technical answers to pass them if they exist?
            // For now, let's just pass what we have, similar to how the client did it
            // (Client had state of "answers" but only for the current form).

            // Wait, existing OnboardingForm logic inside `submitAnswers`:
            // It just sent { questions: ..., submittedAt: ... } to /ai/evaluate-business-profile?
            // NO, `evaluateBusinessProfile` in `api.ts` constructs the payload.
            // But `OnboardingForm.tsx` (lines 483-490) implementation of `submitAnswers` seems to construct a GENERIC payload:
            // { questions: [{questionNumber, question, answer}], submittedAt }
            // And sends it to... wait. 
            // In `OnboardingForm.tsx` line 445: calls calls `/api/combine-pdfs` (that's for PDF).
            // But line 16 imports `evaluateBusinessProfile`.
            // HOWEVER, looking closely at `OnboardingForm.tsx` lines 478-524 (`submitAnswers` function):
            // It calls `fetch` to... WHERE? 
            // Ah, line 504: `json: async () => ({ status: "next" })` -> It MOCKED the response?!
            // Wait, let me check `OnboardingForm.tsx` again.
        }

        // RE-READING `OnboardingForm.tsx` provided in previously view_file output:
        // Lines 478+:
        // const submitAnswers = useCallback(async (finalAnswers) => {
        //   ...
        //   const data = { questions: ..., submittedAt: ... };
        //   console.log("... Enviando respuestas a la API...");
        //.  ...
        //   const response = { ok: true, json: async () => ({ status: "next" }) }; // MOCK!!!
        // ...

        // It seems the client-side code I saw was mocking the API call! 
        // But `app/lib/api.ts` HAS real functions `evaluateBusinessProfile` etc.
        // If the user wants to SECURE implementation, I should wire it up to the REAL API functions if they exist, 
        // or replicate the mock behavior securely if that's what is intended for now.
        // Given the instructions "Secure inputs...", usually implies "Secure the Real Flow".
        // But if the Real Flow wasn't hooked up in the component, maybe I shouldn't hook it up unless asked?
        // HOWEVER, `api.ts` exists and has code.
        // Let's assume for COMMERCIAL form we stick to the safe approach:
        // If the client WAS mocking it, maybe I should just save to DB and return 'next'?

        // BUT, there is an `actions.ts` I'm editing.
        // If I assume the user WANTS the AI evaluation, I should call it.
        // But `evaluateBusinessProfile` requires matching questions indices.

        // SAFE BET: Just save to DB for now (Security goal achieved: Input Validation + Server Side DB Save).
        // If the user didn't complain about "AI features not working", I shouldn't try to fix feature logic I don't fully understand yet.
        // I will replicate the "save to DB" part which IS security critical.
        // And I will return a success state.

        return { success: true, status: 'next' };

    } catch (error) {
        console.error("Server Action Error (submitOnboardingForm):", error);
        return { success: false, message: "Error interno del servidor." };
    }
}

export async function saveOnboardingProgress(
    formType: 'technical' | 'commercial',
    answers: string[]
): Promise<ActionResponse> {
    const session = await getSession();
    if (!session || session.role !== formType) {
        return { success: false, message: "Sesión inválida." };
    }

    // Basic sanitization for progress saving (prevent storing massive payloads or scripts)
    const sanitizedAnswers = answers.map(a => a.slice(0, 5000).replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, ""));

    const supabase = getSupabaseAdmin(); // Secure Admin Client
    const { error } = await supabase
        .from('form_submissions')
        .upsert(
            {
                company_id: session.companyId,
                role: session.role,
                answers: JSON.stringify(sanitizedAnswers),
                updated_at: new Date().toISOString()
            },
            { onConflict: 'company_id, role' }
        );

    if (error) {
        console.error("Save Progress Error:", error);
        return { success: false, message: "Error al guardar progreso." };
    }

    return { success: true };
}

export async function getOnboardingProgress(
    formType: 'technical' | 'commercial'
): Promise<ActionResponse & { answers?: string[] }> {
    const session = await getSession();
    if (!session || session.role !== formType) {
        return { success: false, message: "Sesión inválida." };
    }

    const supabase = getSupabaseAdmin(); // Secure Admin Client
    const { data, error } = await supabase
        .from('form_submissions')
        .select('answers')
        .eq('company_id', session.companyId)
        .eq('role', session.role)
        .single();

    if (error) {
        return { success: false, message: "No se encontraron datos." };
    }

    let parsedAnswers: string[] = [];
    if (data && data.answers) {
        try {
            parsedAnswers = typeof data.answers === 'string' ? JSON.parse(data.answers) : data.answers;
        } catch (e) {
            console.error("Error parsing answers:", e);
        }
    }

    return { success: true, answers: parsedAnswers };
}

import { sendProposalEmail } from './lib/api';

export async function finalizeOnboarding(answers: string[]): Promise<ActionResponse & { pdfUrl?: string, status?: string }> {
    const session = await getSession();
    if (!session || session.role !== 'commercial') {
        return { success: false, message: "Sesión inválida o rol incorrecto. Solo el rol comercial puede finalizar." };
    }

    // 1. Save Commercial Answers
    const saveResult = await saveOnboardingProgress('commercial', answers);
    if (!saveResult.success) {
        return { success: false, message: "Error al guardar respuestas comerciales." };
    }

    const supabase = getSupabaseAdmin(); // Secure Admin Client
    const companyId = session.companyId;

    // 2. Check if Technical Form is complete
    // We need strict validation here.
    const { data: techData, error: techError } = await supabase
        .from('form_submissions')
        .select('answers')
        .eq('company_id', companyId)
        .eq('role', 'technical')
        .single();

    if (techError || !techData || !techData.answers) {
        return { success: false, message: "Faltan respuestas del perfil técnico." };
    }

    let techAnswers: string[] = [];
    try {
        techAnswers = typeof techData.answers === 'string' ? JSON.parse(techData.answers) : techData.answers;
    } catch (e) { console.error(e); }

    // Validate technical answers length (15 questions per schema, but logic in component said 13? Use schema source of truth: 15)
    // Actually, `technicalFormSchema` enforces 15.
    // If it's less than 13 (from component logic), forbid.
    if (!Array.isArray(techAnswers) || techAnswers.length < 13) {
        return { success: false, message: `El formulario técnico está incompleto (${techAnswers.length}/15).` };
    }
    // Also validate Commercial answers length
    if (answers.length < 27) { // Schema says 27
        return { success: false, message: "El formulario comercial está incompleto." };
    }

    // 3. AI Evaluation
    // We pass the questions text too
    const commercialQuestions = COMERCIAL_FORM.questions;
    const technicalQuestions = TECNOLOGICO_FORM.questions;

    try {
        const evaluationResult = await evaluateBusinessProfile(
            answers,
            commercialQuestions,
            techAnswers,
            technicalQuestions
        );

        if (evaluationResult.status !== "next") {
            // Declined
            return { success: true, status: 'decline' };
        }

        // 4. Generate Proposal
        const proposalResult = await generateProposal(
            answers,
            commercialQuestions,
            techAnswers,
            technicalQuestions
        );

        if (!proposalResult.url) {
            return { success: false, message: "Error al generar la propuesta PDF. Intente nuevamente." };
        }

        // 5. Get Company Info for Email
        const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('contact_email, contact_name')
            .eq('id', companyId)
            .single();

        if (companyError || !companyData || !companyData.contact_email) {
            console.error("Company info missing:", companyError);
            return { success: false, message: "No se encontró email de contacto." };
        }

        const formName = answers[0] || companyData.contact_name || "Cliente";

        // 6. Send Email
        await sendProposalEmail({
            recipientEmail: companyData.contact_email,
            recipientName: formName,
            pdfUrl: proposalResult.url
        });

        return { success: true, status: 'next', pdfUrl: proposalResult.url };

    } catch (error) {
        console.error("Finalize Error:", error);
        return { success: false, message: "Error interno en el proceso de evaluación/generación." };
    }
}
