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

        // All v1 data came from web search snippets, not direct datasheets.
        entry.data_source = "web_search";
        entry.verified = false;

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
