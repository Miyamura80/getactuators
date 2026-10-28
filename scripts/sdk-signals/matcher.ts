import { THEME_RULES } from "@/sdk/rubric";
import type { DimensionId } from "@/sdk/types";
import { TARGETS } from "./targets";

// Brand / product matcher and the keyword tagger for forum posts. A post
// counts for a brand when one of its aliases appears as a whole word; it is
// kept only when it also touches an SDK theme, so "my Dynamixel arrived"
// stays out while "the Dynamixel SDK docs are great" goes in.

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ALIASES = TARGETS.map((t) => ({
    brand: t.brand,
    re: new RegExp(
        `(^|[^a-z0-9])(${t.aliases.map(escapeRe).join("|")})([^a-z0-9]|$)`,
        "i",
    ),
    exclude: t.exclude ? new RegExp(t.exclude.join("|"), "i") : null,
}));

export function matchBrands(text: string): string[] {
    return ALIASES.filter((a) => a.re.test(text) && !a.exclude?.test(text)).map(
        (a) => a.brand,
    );
}

export function aliasIndex(brand: string, text: string): number {
    const a = ALIASES.find((x) => x.brand === brand);
    const m = a?.re.exec(text);
    return m ? m.index + (m[1]?.length ?? 0) : -1;
}

export function tagDimensions(text: string): DimensionId[] {
    return THEME_RULES.filter((r) => new RegExp(r.pattern, "i").test(text)).map(
        (r) => r.dimension,
    );
}

const ENTITIES: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#x27;": "'",
    "&#39;": "'",
    "&#x2F;": "/",
    "&nbsp;": " ",
};

export function plainText(html: string): string {
    return (
        html
            .replace(/<p>/gi, " ")
            .replace(/<[^>]+>/g, "")
            .replace(/&[#\w]+;/g, (e) => ENTITIES[e] ?? " ")
            // Dashes are normalised to a hyphen (house style); words are untouched.
            .replace(/\s*[\u2013\u2014]\s*/g, " - ")
            .replace(/\s+/g, " ")
            .trim()
    );
}

// At most 300 characters around the brand's first mention.
export function excerpt(brand: string, text: string, max = 300): string {
    if (text.length <= max) return text;
    const at = Math.max(0, aliasIndex(brand, text));
    let start = Math.max(0, at - Math.floor(max / 3));
    const end = Math.min(text.length, start + max - 6);
    start = Math.max(0, end - (max - 6));
    return `${start > 0 ? "..." : ""}${text.slice(start, end).trim()}${end < text.length ? "..." : ""}`;
}
