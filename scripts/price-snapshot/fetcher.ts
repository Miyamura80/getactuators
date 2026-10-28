// Polite HTTP for the price bot: a User-Agent that points at the repo,
// robots.txt honoured per host, and at least DELAY_MS between requests to
// the same host.

export const USER_AGENT =
    "actuatorlist-price-bot/1.0 (+https://github.com/Miyamura80/getactuators/tree/main/scripts/price-snapshot)";
const BOT_TOKEN = "actuatorlist-price-bot";
const DELAY_MS = 3000;
const TIMEOUT_MS = 30_000;

export interface Fetched {
    status: number;
    text: string;
    contentType: string;
}

export type FetchText = (url: string, accept?: string) => Promise<Fetched | null>;

// Disallow rules from robots.txt that apply to us: the group for our token,
// else the "*" group. Longest-match Allow overrides are honoured.
type Rules = { allow: string[]; disallow: string[] };

function directives(txt: string): [string, string][] {
    return txt.split(/\r?\n/).flatMap((line) => {
        const [rawKey, ...rest] = line.replace(/#.*/, "").split(":");
        const k = rawKey?.trim().toLowerCase();
        return k ? [[k, rest.join(":").trim()] as [string, string]] : [];
    });
}

export function robotsRules(txt: string): Rules {
    const groups: { agents: string[]; rules: Rules }[] = [];
    let open = false;
    for (const [k, v] of directives(txt)) {
        if (k === "user-agent") {
            if (!open) groups.push({ agents: [], rules: { allow: [], disallow: [] } });
            groups.at(-1)?.agents.push(v.toLowerCase());
            open = true;
            continue;
        }
        open = false;
        const g = groups.at(-1);
        if (g && v && (k === "allow" || k === "disallow")) g.rules[k].push(v);
    }
    const find = (agent: string) => groups.find((g) => g.agents.includes(agent))?.rules;
    return find(BOT_TOKEN) ?? find("*") ?? { allow: [], disallow: [] };
}

const matches = (path: string, rule: string) => {
    const anchored = rule.endsWith("$");
    const body = (anchored ? rule.slice(0, -1) : rule)
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
    return new RegExp(`^${body}${anchored ? "$" : ""}`).test(path);
};

export function robotsAllows(
    rules: { allow: string[]; disallow: string[] },
    path: string,
): boolean {
    const longest = (list: string[]) =>
        Math.max(-1, ...list.filter((r) => matches(path, r)).map((r) => r.length));
    return longest(rules.allow) >= longest(rules.disallow);
}

export function politeFetcher(): FetchText {
    const robots = new Map<string, { allow: string[]; disallow: string[] }>();
    const lastHit = new Map<string, number>();

    async function raw(url: string, accept: string): Promise<Fetched | null> {
        const host = new URL(url).host;
        const wait = (lastHit.get(host) ?? 0) + DELAY_MS - Date.now();
        if (wait > 0) await Bun.sleep(wait);
        lastHit.set(host, Date.now());
        try {
            const res = await fetch(url, {
                headers: { "User-Agent": USER_AGENT, Accept: accept },
                redirect: "follow",
                signal: AbortSignal.timeout(TIMEOUT_MS),
            });
            return {
                status: res.status,
                text: await res.text(),
                contentType: res.headers.get("content-type") ?? "",
            };
        } catch {
            return null;
        }
    }

    return async (url, accept = "text/html,application/json;q=0.9,*/*;q=0.5") => {
        const u = new URL(url);
        if (!robots.has(u.origin)) {
            const r = await raw(`${u.origin}/robots.txt`, "text/plain");
            robots.set(
                u.origin,
                r && r.status === 200
                    ? robotsRules(r.text)
                    : { allow: [], disallow: [] },
            );
        }
        const rules = robots.get(u.origin);
        if (rules && !robotsAllows(rules, u.pathname + u.search))
            return {
                status: 999,
                text: "blocked by robots.txt",
                contentType: "text/plain",
            };
        return raw(url, accept);
    };
}
