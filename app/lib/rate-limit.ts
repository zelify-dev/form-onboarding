import { getSupabaseAdmin } from './supabase';

type RateLimitConfig = {
    limit: number;
    windowMs: number;
};

export async function rateLimit(ip: string, config: RateLimitConfig = { limit: 5, windowMs: 60 * 1000 }): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    try {
        // 1. Get current rate limit entry for this IP
        const { data, error } = await supabase
            .from('rate_limits')
            .select('attempts, last_attempt')
            .eq('ip', ip)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error("Rate Limit Check Error:", error);
            return true; // Fail open to avoid blocking legit users on DB error
        }

        if (!data) {
            // First attempt
            await supabase.from('rate_limits').insert({
                ip,
                attempts: 1,
                last_attempt: now.toISOString()
            });
            return true;
        }

        // Check if last attempt was outside window
        const lastAttemptTime = new Date(data.last_attempt);

        if (lastAttemptTime < windowStart) {
            // Reset window
            await supabase
                .from('rate_limits')
                .update({ attempts: 1, last_attempt: now.toISOString() })
                .eq('ip', ip);
            return true;
        }

        // Within window, check limit
        if (data.attempts >= config.limit) {
            return false;
        }

        // Increment attempts
        await supabase
            .from('rate_limits')
            .update({ attempts: data.attempts + 1, last_attempt: now.toISOString() })
            .eq('ip', ip);

        return true;

    } catch (e) {
        console.error("Rate Limit System Error:", e);
        return true; // Fail open
    }
}
