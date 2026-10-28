import type { Confidence, Sourced } from "../supply-chain/sourced";

// Small builders shared by the robot records.

export const OPEN_ROBOTS_AS_OF = "2026-10";

export const GH = "https://github.com";

// Link to a repo, or a file or folder in it on its default branch.
export function gh(repo: string, path?: string, branch = "main"): string {
    if (!path) return `${GH}/${repo}`;
    const kind = path.endsWith("/") ? "tree" : "blob";
    return `${GH}/${repo}/${kind}/${branch}/${encodeURI(path.replace(/\/$/, ""))}`;
}

export function cost(
    value: number,
    sources: string[],
    opts: {
        unit?: "USD" | "EUR";
        confidence?: Confidence;
        note?: string;
        range?: [number, number];
    } = {},
): Sourced<number> {
    return {
        value,
        unit: opts.unit ?? "USD",
        sources,
        asOf: OPEN_ROBOTS_AS_OF,
        confidence: opts.confidence ?? "reported",
        ...(opts.note ? { note: opts.note } : {}),
        ...(opts.range ? { range: opts.range } : {}),
    };
}
