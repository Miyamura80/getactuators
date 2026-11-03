// /benchmarks URL state: the T-N overlay picks in ?tn=a,b and the open run in
// #run=<actuator-id>/<run-id>.

// Null when the URL has no ?tn= (use the default picks); an empty list when
// the reader cleared every pick (?tn= with no value).
export function readPicks(search: string): string[] | null {
    const raw = new URLSearchParams(search).get("tn");
    if (raw === null) return null;
    return [...new Set(raw.split(",").map((s) => s.trim()).filter((s) => /^[a-z0-9-]+$/.test(s)))];
}

export function writePicks(search: string, picks: string[]): string {
    const params = new URLSearchParams(search);
    params.set("tn", picks.join(","));
    const out = params.toString().replace(/%2C/g, ",");
    return out ? `?${out}` : "";
}

export function readOpenRun(hash: string): string | null {
    const m = /^#run=([a-z0-9-]+\/[a-z0-9-]+)$/.exec(hash);
    return m?.[1] ?? null;
}
