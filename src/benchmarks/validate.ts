import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { ACTUATORS } from "../catalog";
import type { Actuator } from "../catalog/types";
import {
    BENCHMARK_INDEPENDENCE,
    BENCHMARK_METHODS,
    BENCHMARK_ORIGINS,
    type BenchmarkRun,
    CLAIM_BOUNDS,
    SCALAR_METRICS,
    UNCERTAINTY_KEYS,
} from "./types";

// Validator for benchmark submissions: schema and units, folder layout,
// catalog membership, origin rules (core measurements for lab and community
// runs), and plausibility against the datasheet. Run by
// scripts/validate-benchmarks.ts in `make ci` and by tests/benchmarks.

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/;
const GITHUB_HANDLE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

const positive = z.number().finite().positive();
const nonNegative = z.number().finite().nonnegative();

const torqueSpeedPoint = z
    .object({
        rpm: nonNegative.max(20000),
        torqueNm: nonNegative.max(10000),
        efficiency: positive.max(1).optional(),
    })
    .strict();

const thermalPoint = z
    .object({
        torqueNm: positive.max(10000),
        tToLimitS: positive.max(1e6).nullable(),
        windingRiseC: positive.max(250).optional(),
    })
    .strict();

const text = z.string().trim().min(1).max(600);

export const benchmarkRunSchema = z
    .object({
        actuatorId: z.string().regex(SLUG),
        runId: z.string().regex(SLUG).max(80),
        date: z.string().regex(DATE, "use YYYY, YYYY-MM or YYYY-MM-DD"),
        origin: z.enum(BENCHMARK_ORIGINS),
        method: z.enum(BENCHMARK_METHODS),
        independence: z.enum(BENCHMARK_INDEPENDENCE),
        independenceNote: text,
        source: z
            .object({
                url: z.string().url().startsWith("https://"),
                title: text,
                locator: text.optional(),
            })
            .strict()
            .optional(),
        submitter: z.string().regex(GITHUB_HANDLE).optional(),
        unit: text,
        rig: z
            .object({
                torqueSensor: text.nullable(),
                accuracyPct: positive.max(10).nullable(),
                encoder: text.nullable(),
                ambientC: z.number().min(-20).max(60).nullable(),
                busV: positive.max(1000).nullable(),
                controller: text.nullable(),
                firmware: text.optional(),
            })
            .strict(),
        torqueSpeed: z.array(torqueSpeedPoint).min(1).max(500).optional(),
        thermal: z.array(thermalPoint).min(1).max(200).optional(),
        backlashArcmin: nonNegative.max(600).optional(),
        stiffnessNmPerRad: positive.max(1e7).optional(),
        frictionNm: nonNegative.max(1000).optional(),
        ripplePct: nonNegative.max(100).optional(),
        bandwidthHz: positive.max(10000).optional(),
        latencyMs: positive.max(1000).optional(),
        repeatabilityArcmin: nonNegative.max(600).optional(),
        uncertainty: z.partialRecord(z.enum(UNCERTAINTY_KEYS), nonNegative),
        claims: z
            .array(
                z
                    .object({
                        metric: z.enum(SCALAR_METRICS),
                        value: nonNegative,
                        source: text,
                        bound: z.enum(CLAIM_BOUNDS).optional(),
                    })
                    .strict(),
            )
            .optional(),
        plausibilityNote: text.optional(),
        notes: z.string().trim().min(1).max(1200).optional(),
    })
    .strict();

export interface RunContext {
    // Folder names: data/benchmarks/<actuatorId>/<runId>/.
    folderActuator: string;
    folderRun: string;
    // Other files in the run folder (raw CSVs, rig.md, photos).
    files: readonly string[];
    catalog: ReadonlyMap<string, Actuator>;
    today?: string;
}

// Every channel a run reports, as uncertainty keys.
export function reportedChannels(run: BenchmarkRun): string[] {
    const keys: string[] = SCALAR_METRICS.filter((k) => run[k] !== undefined);
    if (run.torqueSpeed?.length) keys.push("torqueNm", "rpm");
    if (run.torqueSpeed?.some((p) => p.efficiency !== undefined))
        keys.push("efficiency");
    if (run.thermal?.length) keys.push("torqueNm", "tToLimitS");
    if (run.thermal?.some((p) => p.windingRiseC !== undefined))
        keys.push("windingRiseC");
    return [...new Set(keys)];
}

function hasMeasurement(run: BenchmarkRun): boolean {
    return reportedChannels(run).length > 0;
}

function publishedErrors(run: BenchmarkRun): string[] {
    const errors: string[] = [];
    if (!run.source) errors.push("published runs need a source { url, title }");
    if (run.method === "raw")
        errors.push('published runs are "reported" or "digitised", not "raw"');
    if (!hasMeasurement(run)) errors.push("run reports no measurement");
    return errors;
}

// Core torque-speed and thermal measurements, required for lab and community.
function coreErrors(run: BenchmarkRun): string[] {
    const errors: string[] = [];
    const ts = run.torqueSpeed ?? [];
    if (ts.length < 5) errors.push("core: torqueSpeed needs at least 5 points");
    if (!ts.some((p) => p.rpm === 0))
        errors.push("core: torqueSpeed needs a stall point (rpm 0) for peak torque");
    if (!run.thermal?.some((p) => p.windingRiseC !== undefined))
        errors.push("core: thermal needs at least one point with windingRiseC");
    return errors;
}

function originErrors(run: BenchmarkRun, ctx: RunContext): string[] {
    if (run.origin === "published") return publishedErrors(run);
    const errors: string[] = [];
    if (run.method !== "raw")
        errors.push(`${run.origin} runs report raw measurements (method "raw")`);
    if (run.origin === "community" && !run.submitter)
        errors.push("community runs need the submitter's GitHub handle");
    const missingRig = Object.entries(run.rig)
        .filter(([, v]) => v === null)
        .map(([k]) => k);
    if (missingRig.length > 0)
        errors.push(`rig fields must be filled: ${missingRig.join(", ")}`);
    errors.push(...coreErrors(run));
    if (!ctx.files.some((f) => f.toLowerCase().endsWith(".csv")))
        errors.push("raw CSV files are required next to run.json");
    if (!ctx.files.includes("rig.md"))
        errors.push("rig.md (rig description) is required next to run.json");
    return errors;
}

function uncertaintyErrors(run: BenchmarkRun): string[] {
    if (run.origin === "published" && run.method === "reported") return [];
    const missing = reportedChannels(run).filter((k) => !(k in run.uncertainty));
    return missing.length > 0 ? [`uncertainty missing for: ${missing.join(", ")}`] : [];
}

// Torque may not rise with speed beyond the stated uncertainty (or 2%).
function envelopeErrors(run: BenchmarkRun): string[] {
    const pts = [...(run.torqueSpeed ?? [])].sort((a, b) => a.rpm - b.rpm);
    const slack = run.uncertainty.torqueNm ?? 0;
    for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const cur = pts[i];
        if (!prev || !cur) continue;
        if (cur.torqueNm > prev.torqueNm * 1.02 + slack)
            return [
                `torque-speed envelope must not rise with speed (${prev.torqueNm} Nm at ${prev.rpm} rpm, then ${cur.torqueNm} Nm at ${cur.rpm} rpm)`,
            ];
    }
    return [];
}

// More torque must not be held for longer.
function thermalErrors(run: BenchmarkRun): string[] {
    const pts = [...(run.thermal ?? [])].sort((a, b) => a.torqueNm - b.torqueNm);
    for (let i = 1; i < pts.length; i++) {
        const lo = pts[i - 1]?.tToLimitS ?? Number.POSITIVE_INFINITY;
        const hi = pts[i]?.tToLimitS ?? Number.POSITIVE_INFINITY;
        if (hi > lo) return ["thermal: a higher torque cannot be held longer"];
    }
    return [];
}

export function measuredPeakNm(run: BenchmarkRun): number | null {
    const all = [
        ...(run.torqueSpeed ?? []).map((p) => p.torqueNm),
        ...(run.thermal ?? []).map((p) => p.torqueNm),
    ];
    return all.length > 0 ? Math.max(...all) : null;
}

function plausibilityErrors(run: BenchmarkRun, a: Actuator): string[] {
    const peak = measuredPeakNm(run);
    const sheet = a.peak_torque_nm;
    if (peak === null || !sheet || run.plausibilityNote) return [];
    const ratio = peak / sheet;
    if (ratio >= 0.3 && ratio <= 1.5) return [];
    return [
        `measured peak ${peak} Nm is ${ratio.toFixed(2)}x the datasheet ${sheet} Nm (allowed 0.3x to 1.5x); add a plausibilityNote if this is real`,
    ];
}

export function validateRun(raw: unknown, ctx: RunContext): string[] {
    const parsed = benchmarkRunSchema.safeParse(raw);
    if (!parsed.success)
        return parsed.error.issues.map(
            (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
        );
    const run = parsed.data as BenchmarkRun;
    const errors: string[] = [];
    if (run.actuatorId !== ctx.folderActuator)
        errors.push(
            `actuatorId "${run.actuatorId}" does not match folder "${ctx.folderActuator}"`,
        );
    if (run.runId !== ctx.folderRun)
        errors.push(`runId "${run.runId}" does not match folder "${ctx.folderRun}"`);
    const today = ctx.today ?? new Date().toISOString().slice(0, 10);
    if (run.date > today) errors.push(`date ${run.date} is in the future`);
    const actuator = ctx.catalog.get(run.actuatorId);
    if (!actuator) errors.push(`actuator "${run.actuatorId}" is not in the catalog`);
    errors.push(
        ...originErrors(run, ctx),
        ...uncertaintyErrors(run),
        ...envelopeErrors(run),
        ...thermalErrors(run),
        ...(actuator ? plausibilityErrors(run, actuator) : []),
    );
    return errors;
}

export interface DirectoryResult {
    runs: BenchmarkRun[];
    errors: string[];
}

const isDir = (p: string) => statSync(p).isDirectory();

const subdirs = (p: string) =>
    readdirSync(p)
        .sort()
        .filter((d) => isDir(join(p, d)));

function readRun(file: string): { raw?: unknown; error?: string } {
    if (!existsSync(file)) return { error: "run.json missing" };
    try {
        return { raw: JSON.parse(readFileSync(file, "utf8")) };
    } catch (e) {
        return { error: `invalid JSON (${(e as Error).message})` };
    }
}

// Validates every data/benchmarks/<actuator>/<run>/run.json under `root`.
export function validateBenchmarkDir(root: string, today?: string): DirectoryResult {
    const catalog = new Map(ACTUATORS.map((a) => [a.id, a]));
    const runs: BenchmarkRun[] = [];
    const errors: string[] = [];
    if (!existsSync(root)) return { runs, errors: [`${root} does not exist`] };
    for (const actuatorDir of subdirs(root)) {
        for (const runDir of subdirs(join(root, actuatorDir))) {
            const rPath = join(root, actuatorDir, runDir);
            const where = `${actuatorDir}/${runDir}/run.json`;
            const { raw, error } = readRun(join(rPath, "run.json"));
            if (error) {
                errors.push(`${where}: ${error}`);
                continue;
            }
            const problems = validateRun(raw, {
                folderActuator: actuatorDir,
                folderRun: runDir,
                files: readdirSync(rPath).filter((f) => f !== "run.json"),
                catalog,
                today,
            });
            errors.push(...problems.map((p) => `${where}: ${p}`));
            if (problems.length === 0) runs.push(raw as BenchmarkRun);
        }
    }
    return { runs, errors };
}
