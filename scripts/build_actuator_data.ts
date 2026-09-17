#!/usr/bin/env bun
// Merge the per-category actuator JSON files in data/actuators/ into a single
// normalized dataset the frontend imports (frontend/src/data/actuators.json).
// Adds derived fields (torque density, price-per-Nm) and a provenance flag.
// Re-run after editing any data/actuators/*.json:  bun run scripts/build_actuator_data.ts

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const REPO_ROOT = join(import.meta.dir, "..");
const SRC_DIR = join(REPO_ROOT, "data", "actuators");
const OUT_FILE = join(REPO_ROOT, "frontend", "src", "data", "actuators.json");

interface Actuator {
    id: string;
    name: string;
    brand: string;
    category: string;
    peak_torque_nm: number | null;
    weight_g: number | null;
    price_usd: number | null;
    torque_density_nm_per_kg: number | null;
    price_per_nm: number | null;
    data_source: string;
    verified: boolean;
    [key: string]: unknown;
}

function round(n: number, dp = 1): number {
    const f = 10 ** dp;
    return Math.round(n * f) / f;
}

// Brand -> country of origin (matched by substring, first match wins).
const COUNTRY: [string, string, string][] = [
    ["cubemars", "China", "\u{1F1E8}\u{1F1F3}"],
    ["unitree", "China", "\u{1F1E8}\u{1F1F3}"],
    ["steadywin", "China", "\u{1F1E8}\u{1F1F3}"],
    ["xiaomi", "China", "\u{1F1E8}\u{1F1F3}"],
    ["myactuator", "China", "\u{1F1E8}\u{1F1F3}"],
    ["robstride", "China", "\u{1F1E8}\u{1F1F3}"],
    ["lkm", "China", "\u{1F1E8}\u{1F1F3}"],
    ["waveshare", "China", "\u{1F1E8}\u{1F1F3}"],
    ["feetech", "China", "\u{1F1E8}\u{1F1F3}"],
    ["hiwonder", "China", "\u{1F1E8}\u{1F1F3}"],
    ["leaderdrive", "China", "\u{1F1E8}\u{1F1F3}"],
    ["damiao", "China", "\u{1F1E8}\u{1F1F3}"],
    ["innfos", "China", "\u{1F1E8}\u{1F1F3}"],
    ["atar", "China", "\u{1F1E8}\u{1F1F3}"],
    ["ipower", "China", "\u{1F1E8}\u{1F1F3}"],
    ["robotis", "South Korea", "\u{1F1F0}\u{1F1F7}"],
    ["harmonic drive", "Japan", "\u{1F1EF}\u{1F1F5}"],
    ["nabtesco", "Japan", "\u{1F1EF}\u{1F1F5}"],
    ["nidec", "Japan", "\u{1F1EF}\u{1F1F5}"],
    ["maxon", "Switzerland", "\u{1F1E8}\u{1F1ED}"],
    ["spinea", "Slovakia", "\u{1F1F8}\u{1F1F0}"],
    ["tq-systems", "Germany", "\u{1F1E9}\u{1F1EA}"],
    ["trinamic", "Germany", "\u{1F1E9}\u{1F1EA}"],
    ["trampa", "United Kingdom", "\u{1F1EC}\u{1F1E7}"],
    ["odrive", "United States", "\u{1F1FA}\u{1F1F8}"],
    ["mjbots", "United States", "\u{1F1FA}\u{1F1F8}"],
    ["allied", "United States", "\u{1F1FA}\u{1F1F8}"],
];

function countryFor(brand: string): { name: string | null; flag: string | null } {
    const b = brand.toLowerCase();
    for (const [needle, name, flag] of COUNTRY) {
        if (b.includes(needle)) return { name, flag };
    }
    return { name: null, flag: null };
}

function hostname(url: string | null): string | null {
    if (!url) return null;
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return null;
    }
}

const files = readdirSync(SRC_DIR).filter((f) => f.endsWith(".json"));
const merged: Actuator[] = [];
const seen = new Set<string>();
const warnings: string[] = [];

for (const file of files.sort()) {
    const raw = JSON.parse(readFileSync(join(SRC_DIR, file), "utf-8"));
    if (!Array.isArray(raw)) throw new Error(`${file} is not a JSON array`);
    for (const entry of raw as Actuator[]) {
        if (!entry.id) {
            warnings.push(`${file}: entry missing id (${entry.name ?? "?"})`);
            continue;
        }
        if (seen.has(entry.id)) {
            warnings.push(`duplicate id "${entry.id}" (kept first)`);
            continue;
        }
        seen.add(entry.id);

        // Derive torque density when both inputs exist and it is missing.
        if (
            entry.torque_density_nm_per_kg == null &&
            typeof entry.peak_torque_nm === "number" &&
            typeof entry.weight_g === "number" &&
            entry.weight_g > 0
        ) {
            entry.torque_density_nm_per_kg = round(
                entry.peak_torque_nm / (entry.weight_g / 1000),
            );
        }

        // Derive price efficiency ($ per peak N.m).
        entry.price_per_nm =
            typeof entry.price_usd === "number" &&
            typeof entry.peak_torque_nm === "number" &&
            entry.peak_torque_nm > 0
                ? round(entry.price_usd / entry.peak_torque_nm, 2)
                : null;

        // v1 data came from web search snippets. Entries that have since been
        // spot-checked against manufacturer/reseller pages carry verified:true
        // in the source file; everything else stays unverified.
        entry.verified = entry.verified === true;
        entry.data_source = entry.verified ? "spot_checked" : "web_search";

        // Country of origin (by brand).
        const c = countryFor(entry.brand);
        entry.country = c.name;
        entry.country_flag = c.flag;

        // Primary source link + domain for attribution in the UI.
        const src =
            (entry.product_url as string | null) ??
            (entry.datasheet_url as string | null) ??
            (entry.sources as string[] | undefined)?.[0] ??
            null;
        entry.source_url = src;
        entry.source_domain = hostname(src);

        merged.push(entry);
    }
}

merged.sort(
    (a, b) => (b.torque_density_nm_per_kg ?? -1) - (a.torque_density_nm_per_kg ?? -1),
);

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, `${JSON.stringify(merged, null, 2)}\n`);

console.log(
    `Merged ${merged.length} actuators from ${files.length} files -> ${OUT_FILE}`,
);
if (warnings.length) {
    console.log(`\nWarnings (${warnings.length}):`);
    for (const w of warnings) console.log(`  - ${w}`);
}
