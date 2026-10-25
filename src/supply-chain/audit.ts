import { COMPANIES } from "./companies";
import { insideCountry } from "./countries";
import { LAB_MINING_HHI, LAB_STAGE_SHARES } from "./lab-fixtures";
import { SUPPLY_LINKS } from "./links";
import { SEGMENT_MARKETS } from "./market-share";
import {
    EFFECTIVE_COMPETITORS,
    EVS_PER_YEAR,
    HIGHLY_CONCENTRATED_EQUIVALENT,
    HIGHLY_CONCENTRATED_HHI,
    HUMANOIDS_PER_YEAR,
    HUMANOIDS_SHIPPED_2025,
    NDFEB_PER_EV,
    NDFEB_PER_HUMANOID,
    REVENUE_LADDER,
} from "./perspective";
import {
    companySchema,
    siteSchema,
    sourceRefSchema,
    supplyLinkSchema,
} from "./schemas";
import { SITES } from "./sites";
import { type Sourced, isSourced } from "./sourced";
import { SOURCES, getSource } from "./sources";

// Integrity checks over every supply-chain dataset, shared by the registry
// tests and scripts/citation-audit.ts. `errors` fail CI; `warnings` do not.

export interface AuditReport {
    errors: string[];
    warnings: string[];
}

// Datasets the audit walks. Each later page dataset registers itself here.
const DATASETS: Record<string, unknown> = {
    companies: COMPANIES,
    sites: SITES,
    links: SUPPLY_LINKS,
    "lab-stage-shares": LAB_STAGE_SHARES,
    "lab-values": [LAB_MINING_HHI],
    "market-share": SEGMENT_MARKETS,
    "perspective-ladder": REVENUE_LADDER,
    "perspective-units": [
        NDFEB_PER_HUMANOID,
        NDFEB_PER_EV,
        HUMANOIDS_SHIPPED_2025,
        HUMANOIDS_PER_YEAR,
        EVS_PER_YEAR,
    ],
    "perspective-hhi": [
        HIGHLY_CONCENTRATED_HHI,
        HIGHLY_CONCENTRATED_EQUIVALENT,
        ...EFFECTIVE_COMPETITORS,
    ],
};

// Numbers that need no citation of their own: coordinates (the site carries
// its sources). Numbers inside a Sourced value are covered by that value.
const UNCITED_OK = new Set(["lat", "lon"]);

type Visit = (x: unknown, path: string) => boolean;

// Depth-first walk; `visit` returns true to stop descending.
function walk(x: unknown, path: string, visit: Visit): void {
    if (visit(x, path)) return;
    if (Array.isArray(x)) {
        x.forEach((v, i) => walk(v, `${path}[${i}]`, visit));
    } else if (x && typeof x === "object") {
        for (const [k, v] of Object.entries(x)) walk(v, `${path}.${k}`, visit);
    }
}

// Every number in a dataset that sits outside a Sourced value.
export function uncitedNumbers(name: string, data: unknown): string[] {
    const out: string[] = [];
    walk(data, "", (x, path) => {
        if (isSourced(x)) return true;
        const key = path.split(".").pop() ?? "";
        if (typeof x === "number" && !UNCITED_OK.has(key))
            out.push(`${name}${path}: ${x}`);
        return false;
    });
    return out;
}

function sourcedValues(data: unknown): { path: string; s: Sourced<unknown> }[] {
    const out: { path: string; s: Sourced<unknown> }[] = [];
    walk(data, "", (x, path) => {
        if (!isSourced(x)) return false;
        out.push({ path, s: x });
        return true;
    });
    return out;
}

interface Schema {
    safeParse(v: unknown): { success: boolean; error?: { message: string } };
}

function schemaErrors(
    label: string,
    schema: Schema,
    rows: readonly unknown[],
): string[] {
    return rows.flatMap((row, i) => {
        const r = schema.safeParse(row);
        return r.success ? [] : [`${label}[${i}]: ${r.error?.message}`];
    });
}

function duplicateIds(): string[] {
    const errors: string[] = [];
    const seen = new Map<string, string>();
    const records = [
        ...COMPANIES.map((c) => ["company", c.id] as const),
        ...SITES.map((s) => ["site", s.id] as const),
    ];
    for (const [kind, id] of records) {
        const prev = seen.get(id);
        if (prev) errors.push(`duplicate id "${id}" (${prev} and ${kind})`);
        seen.set(id, kind);
    }
    const sources = SOURCES.map((s) => s.id);
    for (const id of new Set(sources.filter((id, i) => sources.indexOf(id) !== i)))
        errors.push(`duplicate source id "${id}"`);
    return errors;
}

function referenceErrors(): string[] {
    const errors: string[] = [];
    const companies = new Set(COMPANIES.map((c) => c.id));
    for (const s of SITES) {
        if (!companies.has(s.companyId))
            errors.push(`site ${s.id}: unknown company "${s.companyId}"`);
        if (!insideCountry(s.country, s.lat, s.lon))
            errors.push(`site ${s.id}: ${s.lat},${s.lon} is outside ${s.country}`);
    }
    for (const l of SUPPLY_LINKS)
        for (const end of [l.from, l.to])
            if (!companies.has(end))
                errors.push(`link ${l.from} -> ${l.to}: unknown company "${end}"`);
    return [...errors, ...marketErrors()];
}

// Shares belong to companies in that segment and add up to at most 100%.
function marketErrors(): string[] {
    const errors: string[] = [];
    for (const m of SEGMENT_MARKETS) {
        let total = 0;
        for (const [id, s] of Object.entries(m.shares)) {
            total += s.value;
            const c = COMPANIES.find((x) => x.id === id);
            if (c?.segment !== m.segment)
                errors.push(
                    `market ${m.segment}: "${id}" is not a company in this segment`,
                );
        }
        if (total > 1 + 1e-9)
            errors.push(`market ${m.segment}: shares add up to ${total}`);
    }
    return errors;
}

// Every citation in the registry, as [where, source ids].
function citations(): [string, readonly string[]][] {
    const out: [string, readonly string[]][] = [
        ...COMPANIES.filter((c) => c.sources).map(
            (c) => [`company ${c.id}`, c.sources ?? []] as [string, string[]],
        ),
        ...SITES.map((s) => [`site ${s.id}`, s.sources] as [string, string[]]),
        ...SUPPLY_LINKS.map(
            (l) => [`link ${l.from} -> ${l.to}`, l.sources] as [string, string[]],
        ),
    ];
    for (const [name, data] of Object.entries(DATASETS))
        for (const { path, s } of sourcedValues(data))
            out.push([`${name}${path}`, s.sources]);
    return out;
}

function sourcedValueIssues(today: string): AuditReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    for (const [name, data] of Object.entries(DATASETS)) {
        for (const { path, s } of sourcedValues(data)) {
            const where = `${name}${path}`;
            if (s.asOf > today)
                errors.push(`${where}: asOf ${s.asOf} is in the future`);
            if (s.confidence !== "reported" && !s.note && !s.range)
                warnings.push(`${where}: ${s.confidence} value has no method note`);
        }
        for (const miss of uncitedNumbers(name, data))
            errors.push(`uncited number ${miss}`);
    }
    return { errors, warnings };
}

export function auditRegistry(
    today = new Date().toISOString().slice(0, 10),
): AuditReport {
    const errors = [
        ...schemaErrors("sources", sourceRefSchema, SOURCES),
        ...schemaErrors("companies", companySchema, COMPANIES),
        ...schemaErrors("sites", siteSchema, SITES),
        ...schemaErrors("links", supplyLinkSchema, SUPPLY_LINKS),
        ...duplicateIds(),
        ...referenceErrors(),
    ];
    const used = new Set<string>();
    for (const [where, ids] of citations()) {
        if (ids.length === 0) errors.push(`${where}: no sources`);
        for (const id of ids) {
            used.add(id);
            if (!getSource(id)) errors.push(`${where}: unknown source "${id}"`);
        }
    }
    const values = sourcedValueIssues(today);
    const orphans = SOURCES.filter((s) => !used.has(s.id)).map(
        (s) => `orphan source "${s.id}"`,
    );
    return {
        errors: [...errors, ...values.errors],
        warnings: [...values.warnings, ...orphans],
    };
}
