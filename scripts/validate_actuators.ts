#!/usr/bin/env bun
// Validate the actuator leaderboard dataset (frontend/src/data/actuators.json)
// and the companion robots dataset. Prints a human-readable report: row counts,
// per-category counts, null counts per numeric field, image coverage and any
// derived-value mismatches (torque density and price per Nm are both derived
// from PEAK torque; tests/data/actuators-integrity.test.ts enforces them).
//
// Exit code is non-zero ONLY on hard structural violations (duplicate or empty
// id, invalid category, non-array sources, missing referenced image). Derived
// mismatches are reported as warnings and never fail the run, so this stays a
// safe informational tool rather than a blocking gate.
//
// Run:  bun run scripts/validate_actuators.ts

import { existsSync } from "node:fs";
import { join } from "node:path";
import actuators from "../frontend/src/data/actuators.json";
import robots from "../frontend/src/data/robots.json";

const VALID_CATEGORIES = new Set([
    "qdd_proprioceptive",
    "integrated_joint",
    "smart_servo",
    "harmonic_precision",
    "frameless_driver",
    "cycloidal_premium",
]);

const NUMERIC_FIELDS = [
    "price_usd",
    "peak_torque_nm",
    "rated_torque_nm",
    "max_speed_rpm",
    "weight_g",
    "torque_density_nm_per_kg",
    "backlash_arcmin",
    "repeatability_arcmin",
    "peak_current_a",
    "power_w",
    "kt_nm_per_a",
    "price_per_nm",
];

const DERIVED_TOLERANCE = 0.05;

interface ActuatorRow {
    id: string;
    name: string;
    brand: string;
    category: string;
    image_url?: string | null;
    verified: boolean;
    sources: unknown;
    peak_torque_nm: number | null;
    weight_g: number | null;
    price_usd: number | null;
    torque_density_nm_per_kg: number | null;
    price_per_nm: number | null;
    [key: string]: unknown;
}

const rows = actuators as unknown as ActuatorRow[];
const REPO_ROOT = join(import.meta.dir, "..");
const PUBLIC_DIR = join(REPO_ROOT, "frontend", "public");

const errors: string[] = [];
const warnings: string[] = [];

function isNonEmptyString(value: unknown): boolean {
    return typeof value === "string" && value.trim().length > 0;
}

function checkStructure(): void {
    const seen = new Set<string>();
    for (const row of rows) {
        const label = isNonEmptyString(row.id) ? row.id : "<empty-id>";
        if (!isNonEmptyString(row.id)) {
            errors.push(`row with empty id (name: ${row.name ?? "?"})`);
        } else if (seen.has(row.id)) {
            errors.push(`duplicate id: ${row.id}`);
        } else {
            seen.add(row.id);
        }
        if (!VALID_CATEGORIES.has(row.category)) {
            errors.push(`${label}: invalid category "${row.category}"`);
        }
        if (!Array.isArray(row.sources)) {
            errors.push(`${label}: sources is not an array`);
        }
        checkImage(row, label);
    }
}

function checkImage(row: ActuatorRow, label: string): void {
    const url = row.image_url;
    if (typeof url === "string" && url.startsWith("/actuator-images/")) {
        const filePath = join(PUBLIC_DIR, url.replace(/^\//, ""));
        if (!existsSync(filePath)) {
            errors.push(`${label}: missing image file for ${url}`);
        }
    }
}

function checkDerived(): void {
    for (const row of rows) {
        checkTorqueDensity(row);
        checkPricePerNm(row);
    }
}

function checkTorqueDensity(row: ActuatorRow): void {
    const td = row.torque_density_nm_per_kg;
    const peak = row.peak_torque_nm;
    const weight = row.weight_g;
    if (
        typeof td === "number" &&
        typeof peak === "number" &&
        typeof weight === "number" &&
        weight > 0
    ) {
        const expected = peak / (weight / 1000);
        const relDiff = Math.abs(expected - td) / td;
        if (relDiff > DERIVED_TOLERANCE) {
            warnings.push(
                `${row.id}: torque_density_nm_per_kg=${td} but peak/weight=` +
                    `${expected.toFixed(1)} (off ${(relDiff * 100).toFixed(1)}%)`,
            );
        }
    }
}

function checkPricePerNm(row: ActuatorRow): void {
    const ppn = row.price_per_nm;
    const price = row.price_usd;
    const peak = row.peak_torque_nm;
    if (
        typeof ppn === "number" &&
        typeof price === "number" &&
        typeof peak === "number" &&
        peak > 0
    ) {
        const expected = price / peak;
        const relDiff = Math.abs(expected - ppn) / ppn;
        if (relDiff > DERIVED_TOLERANCE) {
            warnings.push(
                `${row.id}: price_per_nm=${ppn} but price/peak=` +
                    `${expected.toFixed(2)} (off ${(relDiff * 100).toFixed(1)}%)`,
            );
        }
    }
}

function countBy(getKey: (row: ActuatorRow) => string): Map<string, number> {
    const counts = new Map<string, number>();
    for (const row of rows) {
        const key = getKey(row);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
}

function reportSummary(): void {
    console.log(`Actuators: ${rows.length} rows`);
    const verified = rows.filter((row) => row.verified === true).length;
    console.log(`  verified: ${verified}   unverified: ${rows.length - verified}`);

    console.log("\nBy category:");
    for (const [category, count] of countBy((row) => row.category)) {
        console.log(`  ${category.padEnd(20)} ${count}`);
    }

    console.log("\nNull counts per numeric field:");
    for (const field of NUMERIC_FIELDS) {
        const nulls = rows.filter((row) => row[field] === null).length;
        console.log(`  ${field.padEnd(26)} ${nulls}`);
    }

    const localImages = rows.filter(
        (row) =>
            typeof row.image_url === "string" &&
            row.image_url.startsWith("/actuator-images/"),
    ).length;
    console.log(`\nLocal images referenced: ${localImages}`);
}

function reportRobots(): void {
    const data = robots as unknown as {
        motors: Record<string, { actuator_id: string | null }>;
        robots: Array<{ id: string; joints: Array<{ motor: string }> }>;
    };
    const actuatorIds = new Set(rows.map((row) => row.id));
    const motorKeys = new Set(Object.keys(data.motors));

    console.log(`\nRobots: ${data.robots.length} robots, ${motorKeys.size} motors`);
    for (const [key, motor] of Object.entries(data.motors)) {
        if (motor.actuator_id !== null && !actuatorIds.has(motor.actuator_id)) {
            errors.push(
                `robot motor "${key}": actuator_id "${motor.actuator_id}" not found`,
            );
        }
    }
    for (const robot of data.robots) {
        for (const joint of robot.joints) {
            if (!motorKeys.has(joint.motor)) {
                errors.push(
                    `robot "${robot.id}": joint motor "${joint.motor}" not found`,
                );
            }
        }
    }
}

function main(): number {
    checkStructure();
    checkDerived();
    reportSummary();
    reportRobots();

    if (warnings.length > 0) {
        console.log(`\nWarnings (${warnings.length}):`);
        for (const warning of warnings) {
            console.log(`  WARN ${warning}`);
        }
        console.log(
            "\nNote: torque_density_nm_per_kg and price_per_nm are derived from " +
                "PEAK torque (see tests/data/actuators-integrity.test.ts). Warnings above " +
                "flag rows that do not match that peak-based formula.",
        );
    }

    if (errors.length > 0) {
        console.log(`\nStructural errors (${errors.length}):`);
        for (const error of errors) {
            console.log(`  ERROR ${error}`);
        }
        console.log("\nValidation FAILED.");
        return 1;
    }

    console.log("\nValidation passed: no structural errors.");
    return 0;
}

process.exit(main());
