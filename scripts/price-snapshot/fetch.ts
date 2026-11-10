import { type Robots, parseRobots } from "./robots";

// Polite HTTP: a generic User-Agent naming the repo, robots.txt checked per
// origin (unreachable robots.txt with a 5xx means "disallow", a 4xx means
// "allow", as RFC 9309 says), one request per host at a time with a minimum
// delay between them, and a timeout. Redirects are followed by hand, so each
// hop gets its own robots.txt check and host delay.

export const USER_AGENT =
    "actuatorlist-price-bot/1.0 (+https://github.com/miyamura80/getactuators)";

export class RobotsDenied extends Error {
    constructor(url: string) {
        super(`robots.txt disallows ${url}`);
        this.name = "RobotsDenied";
    }
}

type FetchImpl = (url: string, init?: RequestInit) => Promise<Response>;

export interface FetcherOptions {
    delayMs?: number;
    timeoutMs?: number;
    fetchImpl?: FetchImpl;
    sleep?: (ms: number) => Promise<void>;
}

const MAX_REDIRECTS = 5;

export class PoliteFetcher {
    private robots = new Map<string, Promise<Robots>>();
    private nextAt = new Map<string, number>();
    private readonly delayMs: number;
    private readonly timeoutMs: number;
    private readonly fetchImpl: FetchImpl;
    private readonly sleep: (ms: number) => Promise<void>;

    constructor(opts: FetcherOptions = {}) {
        this.delayMs = opts.delayMs ?? 5000;
        this.timeoutMs = opts.timeoutMs ?? 20000;
        this.fetchImpl = opts.fetchImpl ?? ((u, i) => fetch(u, i));
        this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    }

    private async raw(url: string, accept: string): Promise<Response> {
        const host = new URL(url).host;
        // Claim the slot before sleeping, so callers that wait at the same
        // time get successive slots instead of firing together.
        const now = Date.now();
        const start = Math.max(this.nextAt.get(host) ?? 0, now);
        this.nextAt.set(host, start + this.delayMs);
        if (start > now) await this.sleep(start - now);
        return this.fetchImpl(url, {
            headers: { "user-agent": USER_AGENT, accept },
            redirect: "manual",
            signal: AbortSignal.timeout(this.timeoutMs),
        });
    }

    robotsFor(origin: string): Promise<Robots> {
        let r = this.robots.get(origin);
        if (!r) {
            r = this.raw(`${origin}/robots.txt`, "text/plain")
                .then(async (res) => {
                    if (res.ok) return parseRobots(await res.text(), USER_AGENT);
                    if (res.status >= 500)
                        return parseRobots("User-agent: *\nDisallow: /", USER_AGENT);
                    return parseRobots("", USER_AGENT);
                })
                .catch(() => parseRobots("User-agent: *\nDisallow: /", USER_AGENT));
            this.robots.set(origin, r);
        }
        return r;
    }

    async get(url: string, accept = "text/html,application/json"): Promise<Response> {
        let current = url;
        for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
            const res = await this.once(current, accept);
            const location = res.headers.get("location");
            if (res.status < 300 || res.status >= 400 || !location) return res;
            current = new URL(location, current).toString();
        }
        throw new Error(`more than ${MAX_REDIRECTS} redirects from ${url}`);
    }

    private async once(url: string, accept: string): Promise<Response> {
        const u = new URL(url);
        const robots = await this.robotsFor(u.origin);
        if (!robots.allowed(u.pathname + u.search)) throw new RobotsDenied(url);
        if (robots.crawlDelayMs && robots.crawlDelayMs > this.delayMs)
            this.nextAt.set(
                u.host,
                Math.max(
                    this.nextAt.get(u.host) ?? 0,
                    Date.now() + robots.crawlDelayMs,
                ),
            );
        return this.raw(url, accept);
    }
}
