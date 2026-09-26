// Fixed-window, in-memory, per-client limiter. Good enough for a single
// read-only instance; it resets on deploy and is not shared across replicas.

export const RATE_LIMIT = 120;
export const RATE_WINDOW_S = 60;

export interface RateLimitResult {
    allowed: boolean;
    limit: number;
    remaining: number;
    // Seconds until the current window resets.
    reset: number;
}

export function createRateLimiter(
    limit: number = RATE_LIMIT,
    windowS: number = RATE_WINDOW_S,
    now: () => number = Date.now,
) {
    let windowStart = 0;
    let counts = new Map<string, number>();
    return (key: string): RateLimitResult => {
        const t = now();
        const start = Math.floor(t / (windowS * 1000)) * windowS * 1000;
        if (start !== windowStart) {
            // New window: drop every old counter so memory stays bounded.
            windowStart = start;
            counts = new Map();
        }
        const used = (counts.get(key) ?? 0) + 1;
        counts.set(key, used);
        const reset = Math.max(1, Math.ceil((start + windowS * 1000 - t) / 1000));
        return {
            allowed: used <= limit,
            limit,
            remaining: Math.max(0, limit - used),
            reset,
        };
    };
}

// First hop of X-Forwarded-For (the original client behind the edge proxy).
export function clientKey(req: Request): string {
    const xff = req.headers.get("x-forwarded-for");
    const first = xff?.split(",")[0]?.trim();
    return first || req.headers.get("x-real-ip") || "anonymous";
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
    return {
        // IETF draft-ietf-httpapi-ratelimit-headers (structured fields form).
        "RateLimit-Policy": `"default";q=${r.limit};w=${RATE_WINDOW_S}`,
        RateLimit: `"default";r=${r.remaining};t=${r.reset}`,
        // Widely supported legacy spelling for older clients.
        "X-RateLimit-Limit": String(r.limit),
        "X-RateLimit-Remaining": String(r.remaining),
        "X-RateLimit-Reset": String(r.reset),
    };
}
