import { ACTUATORS } from "../catalog";
import { licenceErrors } from "../supply-chain/licence";
import { SDK_BRANDS } from "./brands";
import { SDK_CHECKS } from "./checks";
import { SDK_EVIDENCE } from "./evidence";
import { SDK_SOURCES } from "./sources";

// Integrity rules for /sdk, run by the citation audit (make citation_audit):
// every catalog brand maps to one SDK brand, every check cites a known
// source, and every evidence item is a short paraphrase with a public link,
// no usernames and a past date. Each post is its own "facts" source.

const MAX_CLAIM = 220;
const EM_DASH = String.fromCharCode(0x2014);

function brandErrors(): string[] {
    const errors: string[] = [];
    for (const name of new Set(ACTUATORS.map((a) => a.brand))) {
        const n = SDK_BRANDS.filter((b) => b.catalogBrands.includes(name)).length;
        if (n !== 1)
            errors.push(`sdk: catalog brand "${name}" maps to ${n} SDK brands`);
    }
    const sources = new Set(SDK_SOURCES.map((s) => s.id));
    for (const [brand, checks] of Object.entries(SDK_CHECKS)) {
        if (!SDK_BRANDS.some((b) => b.id === brand && b.kind === "sdk"))
            errors.push(`sdk: checks for unknown or unscored brand "${brand}"`);
        for (const c of checks)
            for (const id of c.sources)
                if (!sources.has(id))
                    errors.push(
                        `sdk check ${brand} "${c.label}": unknown source "${id}"`,
                    );
    }
    return errors;
}

function evidenceErrors(today: string): string[] {
    const errors: string[] = [];
    const scored = new Set(SDK_BRANDS.filter((b) => b.kind === "sdk").map((b) => b.id));
    const ids = new Set<string>();
    for (const e of SDK_EVIDENCE) {
        const where = `sdk evidence ${e.id}`;
        if (ids.has(e.id)) errors.push(`${where}: duplicate id`);
        ids.add(e.id);
        if (!scored.has(e.brand)) errors.push(`${where}: unknown brand "${e.brand}"`);
        if (!/^https:\/\//.test(e.url)) errors.push(`${where}: url must be https`);
        if (e.claim.length > MAX_CLAIM || e.claim.includes(EM_DASH))
            errors.push(
                `${where}: claim must be under ${MAX_CLAIM} characters, no em dash`,
            );
        if (/\/u(ser)?\/[^/]+/.test(e.url) || /\bu\/[A-Za-z0-9_-]+/.test(e.claim))
            errors.push(`${where}: no usernames in committed data`);
        if (e.date > today) errors.push(`${where}: date ${e.date} is in the future`);
    }
    return errors;
}

export function sdkErrors(today = new Date().toISOString().slice(0, 10)): string[] {
    const posts = [...new Set(SDK_EVIDENCE.map((e) => e.url))];
    return [
        ...brandErrors(),
        ...evidenceErrors(today),
        ...licenceErrors({
            name: "sdk-evidence",
            file: "src/sdk/data/sdk-evidence.json",
            sources: posts.map((id) => ({ id, reuse: "facts" })),
            citations: SDK_EVIDENCE.map((e) => [`evidence ${e.id}`, [e.url]]),
            allowlist: {},
        }),
    ];
}
