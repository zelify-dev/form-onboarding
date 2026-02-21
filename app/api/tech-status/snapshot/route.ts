import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { getSupabaseAdmin } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('form_submissions')
        .select('answers')
        .eq('company_id', session.companyId)
        .eq('role', 'technical')
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
