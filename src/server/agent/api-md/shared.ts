import type { Page } from "@/api/pagination";
import { countryName } from "@/country-flag";
import { formatValue } from "@/supply-chain/format";
import { STAGE_LABEL, type Stage } from "@/supply-chain/stages";
import { absoluteUrl } from "../../site";
import { toAbsolute } from "../jsonld";
import { mdLink, mdText } from "../md";

// Helpers shared by the API markdown renderers (see ./index.ts).

// The markdown twin of an API URL: `.md` on the path, query string kept.
export function apiMarkdownPath(path: string, query = ""): string {
    const q = query && !query.startsWith("?") ? `?${query}` : query;
    return `${path.replace(/\/$/, "")}.md${q}`;
}

// Absolute link to the markdown twin of `/api/v1/<path>`.
export function twinLink(text: string, path: string, query = ""): string {
    return mdLink(text, absoluteUrl(apiMarkdownPath(`/api/v1/${path}`, query)));
}

// Link to the twin of one record: /api/v1/<collection>/<id>.md.
export const idTwin = (text: string, collection: string, id: string) =>
    twinLink(text, `${collection}/${encodeURIComponent(id)}`);

export function filterSummary(url: URL): string {
    const parts = [...url.searchParams]
        .filter(([k]) => k !== "cursor" && k !== "limit")
        .map(([k, v]) => `${k}=${v}`);
    return parts.length > 0 ? `: ${mdText(parts.join(", "))}` : "";
}

export function pageSummary(page: Page<unknown>, url: URL, noun: string): string {
    const { total, has_more, next_cursor } = page.pagination;
    if (page.data.length === 0) return `No ${noun} match this query (total ${total}).`;
    const lines = [`${page.data.length} of ${total} matching ${noun} on this page.`];
    if (has_more && next_cursor) {
        const next = new URLSearchParams(url.searchParams);
        next.set("cursor", next_cursor);
        const q = `?${next.toString()}`;
        lines.push(
            `Next page: ${mdLink("markdown", absoluteUrl(apiMarkdownPath(url.pathname, q)))}, ${mdLink("JSON", absoluteUrl(`${url.pathname}${q}`))}.`,
        );
    }
    return lines.join(" ");
}

// "Japan (JP)" for an ISO code; other values unchanged.
export const country = (code: string | null | undefined): string =>
    !code
        ? "n/a"
        : /^[A-Za-z]{2}$/.test(code)
          ? `${countryName(code)} (${code})`
          : mdText(code);

export const stageList = (stages: readonly Stage[]): string =>
    stages.map((s) => STAGE_LABEL[s] ?? s).join(", ") || "n/a";

export const share = (x: number | null | undefined): string =>
    x === null || x === undefined ? "n/a" : `${Math.round(x * 100)}%`;

export const orNa = (s: string | null | undefined): string => (s ? mdText(s) : "n/a");

// A cited source as the JSON carries it (supply-chain refs carry publisher and
// accessed date; humanoid and people refs only title and url).
export interface SourceRef {
    title: string;
    url: string;
    publisher?: string;
    accessed?: string | null;
}

// A sourced number as the supply-chain views serialize it.
export interface SourcedView {
    value: number;
    unit?: string | null;
    range?: readonly [number, number] | [number, number] | null;
    as_of?: string;
    confidence?: string;
    sources: readonly SourceRef[];
}

export interface SourceNotes {
    // "[^1][^2]" for these sources, numbering new ones in first-cited order.
    ref(sources: readonly SourceRef[]): string;
    // A formatted sourced number with its footnote refs, or "n/a".
    value(v: SourcedView | null | undefined): string;
    // The "## Sources" section, or "" when nothing was cited.
    section(): string;
}

// Footnotes over the JSON's inline sources, deduplicated by URL.
export function sourceNotes(): SourceNotes {
    const order: SourceRef[] = [];
    const key = (s: SourceRef) => s.url || s.title;
    const ref = (sources: readonly SourceRef[]) =>
        sources
            .map((s) => {
                let n = order.findIndex((o) => key(o) === key(s));
                if (n < 0) n = order.push(s) - 1;
                return `[^${n + 1}]`;
            })
            .join("");
    return {
        ref,
        value: (v) => {
            if (!v) return "n/a";
            const range = v.range
                ? ([v.range[0], v.range[1]] as [number, number])
                : undefined;
            const text = formatValue(v.value, v.unit ?? undefined, range);
            const mark = v.confidence === "estimated" ? "~" : "";
            const model = v.confidence === "modeled" ? " (model)" : "";
            return `${mark}${mdText(text)}${model}${ref(v.sources)}`;
        },
        section: () => {
            if (order.length === 0) return "";
            const lines = order.map((s, i) => {
                const by = s.publisher ? `${mdText(s.publisher)}, ` : "";
                const seen = s.accessed ? ` (accessed ${s.accessed})` : "";
                const url = s.url ? ` ${toAbsolute(s.url)}` : "";
                return `[^${i + 1}]: ${by}"${mdText(s.title)}".${url}${seen}.`;
            });
            return `## Sources\n\n${lines.join("\n")}`;
        },
    };
}

// For long lists: the table shows the first `max` rows and points at the JSON.
export function capped<T>(
    rows: readonly T[],
    max: number,
    url: URL,
): {
    rows: readonly T[];
    note: string;
} {
    if (rows.length <= max) return { rows, note: "" };
    const json = absoluteUrl(`${url.pathname}${url.search}`);
    return {
        rows: rows.slice(0, max),
        note: `First ${max} of ${rows.length} shown; the full list is in ${json}.`,
    };
}
