// robots.txt (RFC 9309): the group for our product token, else "*"; the
// longest matching rule wins and Allow wins a tie; "*" and "$" wildcards.
// Crawl-delay, when given, raises the per-host delay. Paths and patterns are
// compared with percent-encoded unreserved characters decoded, so
// "/%70rivate" meets "Disallow: /private".

interface Rule {
    allow: boolean;
    pattern: string;
}

export interface Robots {
    allowed(path: string): boolean;
    crawlDelayMs: number | null;
}

// %XX for an unreserved character (RFC 3986) is the character itself.
export function normalisePath(path: string): string {
    return path.replace(/%([0-9a-f]{2})/gi, (m, hex: string) => {
        const c = String.fromCharCode(Number.parseInt(hex, 16));
        return /[A-Za-z0-9\-._~]/.test(c) ? c : m.toUpperCase();
    });
}

function matcher(pattern: string): RegExp {
    const anchored = pattern.endsWith("$");
    const body = (anchored ? pattern.slice(0, -1) : pattern)
        .split("*")
        .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*");
    return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

interface Group {
    agents: string[];
    rules: Rule[];
    delay: number | null;
}

function groupsOf(text: string): Group[] {
    const groups: Group[] = [];
    let current: Group | null = null;
    let lastWasAgent = false;
    for (const raw of text.split(/\r?\n/)) {
        const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(raw.replace(/#.*$/, "").trim());
        if (!m) continue;
        const key = (m[1] as string).toLowerCase();
        const value = (m[2] as string).trim();
        const isAgent = key === "user-agent";
        if (isAgent && (!current || !lastWasAgent)) {
            current = { agents: [], rules: [], delay: null };
            groups.push(current);
        }
        lastWasAgent = isAgent;
        if (current) addLine(current, key, value);
    }
    return groups;
}

function addLine(g: Group, key: string, value: string): void {
    if (key === "user-agent") {
        if (value) g.agents.push(value.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && value)
        g.rules.push({ allow: key === "allow", pattern: normalisePath(value) });
    else if (key === "crawl-delay" && Number(value) > 0) g.delay = Number(value);
}

// The longest matching rule; Allow wins a tie.
function decide(rules: Rule[], path: string): boolean {
    let best: Rule | null = null;
    for (const r of rules) {
        if (!matcher(r.pattern).test(path)) continue;
        const longer = !best || r.pattern.length > best.pattern.length;
        const tieAllow = best && r.pattern.length === best.pattern.length && r.allow;
        if (longer || tieAllow) best = r;
    }
    return best ? best.allow : true;
}

export function parseRobots(text: string, agent: string): Robots {
    const groups = groupsOf(text);
    const token = agent.toLowerCase();
    const mine = groups.filter((g) =>
        g.agents.some((a) => a !== "*" && token.includes(a)),
    );
    const chosen = mine.length ? mine : groups.filter((g) => g.agents.includes("*"));
    const rules = chosen.flatMap((g) => g.rules);
    const delay = chosen.map((g) => g.delay).find((d) => d !== null) ?? null;
    return {
        allowed: (path: string) => decide(rules, normalisePath(path)),
        crawlDelayMs: delay === null ? null : delay * 1000,
    };
}
