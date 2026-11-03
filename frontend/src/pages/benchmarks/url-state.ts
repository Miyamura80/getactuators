// /benchmarks URL state: the T-N overlay picks in ?tn=a,b and the open run in
// #run=<actuator-id>/<run-id>.

export function readPicks(search: string): string[] {
    const raw = new URLSearchParams(search).get("tn") ?? "";
    return [...new Set(raw.split(",").map((s) => s.trim()).filter((s) => /^[a-z0-9-]+$/.test(s)))];
}

export function writePicks(search: string, picks: string[]): string {
    const params = new URLSearchParams(search);
    if (picks.length) params.set("tn", picks.join(","));
    else params.delete("tn");
    const out = params.toString().replace(/%2C/g, ",");
    return out ? `?${out}` : "";
}

export function readOpenRun(hash: string): string | null {
    const m = /^#run=([a-z0-9-]+\/[a-z0-9-]+)$/.exec(hash);
    return m?.[1] ?? null;
}
