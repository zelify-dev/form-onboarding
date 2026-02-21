import { NextResponse } from 'next/server';
import { getSession } from '../../lib/session';
import { getSupabaseAdmin } from '../../lib/supabase';
import DOMPurify from 'isomorphic-dompurify';
import { jwtVerify } from 'jose';

export const runtime = 'edge';

const encoder = new TextEncoder();

export async function GET(request: Request) {
    const session = await getSession();
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Extract msUntilExpiry from standard JWT
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/onboarding_session=([^;]+)/);
    let msUntilExpiry = 15 * 60 * 1000; // Default 15m fallback
    if (match) {
        try {
            const secret = process.env.SUPABASE_JWT_SECRET;
            if (secret) {
                const { payload } = await jwtVerify(match[1], new TextEncoder().encode(secret));
                if (payload.exp) {
                    msUntilExpiry = (payload.exp * 1000) - Date.now();
                }
            }
        } catch (e) {
            // Invalid token
            return new NextResponse("Unauthorized", { status: 401 });
        }
    }

    let heartbeatTimer: NodeJS.Timeout;
    let expiryTimeout: NodeJS.Timeout;
    let channel: any;

    const stream = new ReadableStream({
        async start(controller) {
            const supabase = getSupabaseAdmin();

            // Zero Trust Filtering - Company precise scope
            channel = supabase.channel(`tech-changes-${session.companyId}`).on(
                'postgres_changes',
                {
                    event: 'UPDATE', // Only updates matter for this table since the row usually exists
                    schema: 'public',
                    table: 'form_submissions',
                    filter: `company_id=eq.${session.companyId}`
                },
                (payload) => {
                    // Only dispatch if the role is technical (belt and suspenders check)
                    const newData = payload.new as any;
                    if (newData.company_id === session.companyId && newData.role === 'technical') {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
                    }
                }
            ).subscribe();

            // Heartbeat
            heartbeatTimer = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(`: ping\n\n`));
                } catch (e) { }
            }, 15000);

            // Bounded Lifetime
            expiryTimeout = setTimeout(() => {
                try {
                    const endPayload = { type: 'SESSION_EXPIRED' };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(endPayload)}\n\n`));
                    controller.close();
                } catch (e) { }
            }, Math.max(0, msUntilExpiry));

            // Clean up: Request Abort overrides memory leaks
            request.signal.addEventListener('abort', () => {
                clearInterval(heartbeatTimer);
                clearTimeout(expiryTimeout);
                if (channel) supabase.removeChannel(channel);
                try { controller.close(); } catch (e) { }
            });
        },
        cancel() {
            clearInterval(heartbeatTimer);
            clearTimeout(expiryTimeout);
            if (channel) getSupabaseAdmin().removeChannel(channel);
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Role Gate: Strictly enforce
    if (session.role !== 'technical') {
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { answers } = body;

        if (!Array.isArray(answers)) {
            return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
        }

        const sanitizedAnswers = answers.map((a: string) => DOMPurify.sanitize(a, { ALLOWED_TAGS: [] }).slice(0, 5000));

        const supabase = getSupabaseAdmin();

        const { error } = await supabase
            .from('form_submissions')
            .upsert({
                company_id: session.companyId,
                role: 'technical',
                answers: JSON.stringify(sanitizedAnswers),
                updated_at: new Date().toISOString()
            }, { onConflict: 'company_id, role' });

        if (error) {
            return NextResponse.json({ success: false, message: "Database Error" }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
