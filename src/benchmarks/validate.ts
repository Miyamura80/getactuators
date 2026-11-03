import { z } from "zod";
import { type Citation, licenceErrors } from "../supply-chain/licence";
import { PLAUSIBLE_PEAK_RATIO, measuredPeak, reportedMetrics } from "./index";
import {
    BENCHMARK_FACTS_ALLOWLIST,
    BENCHMARK_SOURCES,
    sourceIdForUrl,
} from "./sources";
import {
    BENCHMARK_ORIGINS,
    type BenchmarkRun,
    DATA_METHODS,
    METRIC_KEYS,
    SOURCE_KINDS,
} from "./types";

// Validation of benchmark submissions, run by scripts/validate-benchmarks.ts
// in `make ci`: schema and units, folder layout, catalog link, protocol
// (core measurements and minimum samples for lab and community runs), raw
// files, plausibility against the datasheet, and source licences. Server and
// script side only (zod). The protocol is docs/benchmarks/protocol.md.

export const PROTOCOL_DOC = "docs/benchmarks/protocol.md";

// Minimum samples for a lab or community run (protocol section "Samples").
export const MIN_TN_POINTS = 5;
export const MIN_THERMAL_POINTS = 3;

export const TN_CSV = "torque-speed.csv";
export const THERMAL_CSV = "thermal.csv";
export const RIG_DOC = "rig.md";
export const TN_CSV_HEADER = ["rpm", "torque_nm", "efficiency"];
export const THERMAL_CSV_HEADER = ["torque_nm", "t_to_limit_s", "winding_rise_c"];
const PHOTO = /^rig[-\w]*\.(jpe?g|png|webp)$/;

const pos = (maxValue: number) => z.number().positive().max(maxValue);
const nonNeg = (maxValue: number) => z.number().min(0).max(maxValue);

const rigSchema = z
    .object({
        torqueSensor: z.string().min(3),
        accuracyPct: z.number().positive().max(10).nullable(),
        encoder: z.string().min(3),
        ambientC: z.number().min(-40).max(80).nullable(),
        busV: z.number().positive().max(1000).nullable(),
        controller: z.string().min(2),
        firmware: z.string().min(1).optional(),
    })
    .strict();

const runSchema = z
    .object({
        actuatorId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
        runId: z.string().regex(/^[a-z0-9][a-z0-9-]{2,63}$/),
        date: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/),
        origin: z.enum(BENCHMARK_ORIGINS),
        source: z
            .object({ url: z.string().url(), title: z.string().min(5) })
            .strict()
            .optional(),
        sourceKind: z.enum(SOURCE_KINDS).optional(),
        submitter: z
            .string()
            .regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/)
            .optional(),
        dataMethod: z.enum(DATA_METHODS),
        methodNote: z.string().min(10).optional(),
        revision: z.string().min(1).optional(),
        otherRevision: z.boolean().optional(),
        rig: rigSchema,
        torqueSpeed: z
            .array(
                z
                    .object({
                        rpm: nonNeg(20000),
                        torqueNm: nonNeg(5000),
                        efficiency: z.number().positive().max(1).optional(),
                    })
                    .strict(),
            )
            .min(1)
            .optional(),
        thermal: z
            .array(
                z
                    .object({
                        torqueNm: pos(5000),
                        tToLimitS: pos(1e6).nullable(),
                        windingRiseC: pos(250).optional(),
                    })
                    .strict(),
            )
            .min(1)
            .optional(),
        peakTorqueNm: pos(5000).optional(),
        noLoadRpm: pos(20000).optional(),
        backlashArcmin: nonNeg(600).optional(),
        stiffnessNmPerRad: pos(1e7).optional(),
        frictionNm: nonNeg(500).optional(),
        ripplePct: nonNeg(100).optional(),
        bandwidthHz: pos(10000).optional(),
        latencyMs: pos(1000).optional(),
        repeatabilityArcmin: nonNeg(600).optional(),
        uncertainty: z.record(z.string(), z.number().positive()),
        plausibilityNote: z.string().min(20).optional(),
        note: z.string().min(1).optional(),
    })
    .strict();

// One submission folder: data/benchmarks/<actuatorId>/<runId>/.
export interface RunFolder {
    actuatorId: string;
    runId: string;
    files: readonly string[];
    read: (name: string) => string;
}

export interface CatalogEntry {
    id: string;
    peak_torque_nm: number | null;
}

export interface Checked {
    run?: BenchmarkRun;
    errors: string[];
}

function parseRun(folder: RunFolder): Checked {
    if (!folder.files.includes("run.json")) return { errors: ["missing run.json"] };
    let raw: unknown;
    try {
        raw = JSON.parse(folder.read("run.json"));
    } catch (e) {
        return { errors: [`run.json is not valid JSON: ${(e as Error).message}`] };
    }
    const parsed = runSchema.safeParse(raw);
    if (!parsed.success)
        return {
            errors: parsed.error.issues.map(
                (i) => `run.json ${i.path.join(".") || "(root)"}: ${i.message}`,
            ),
        };
    return { run: parsed.data as BenchmarkRun, errors: [] };
}

function dateErrors(date: string, today: string): string[] {
    const [y, m = "01", d = "01"] = date.split("-");
    const t = new Date(`${y}-${m}-${d}T00:00:00Z`);
    if (Number.isNaN(t.getTime()) || t.toISOString().slice(0, 10) !== `${y}-${m}-${d}`)
        return [`date ${date} is not a calendar date`];
    return date.slice(0, 10) > today ? [`date ${date} is in the future`] : [];
}

function publishedErrors(run: BenchmarkRun): string[] {
    const errors: string[] = [];
    if (!run.source) errors.push("published runs need source {url, title}");
    else if (!sourceIdForUrl(run.source.url))
        errors.push(
            `source url ${run.source.url} is not in src/benchmarks/sources.ts; add it there with its reuse value`,
        );
    if (!run.sourceKind) errors.push("published runs need sourceKind");
    if (run.submitter) errors.push("submitter is for community runs only");
    if (reportedMetrics(run).length === 0)
        errors.push("a published run must report at least one metric");
    return errors;
}

// Lab and community runs follow the protocol in full: raw data, a described
// rig and both core measurement groups with the minimum samples.
function protocolErrors(run: BenchmarkRun): string[] {
    const checks: [boolean, string][] = [
        [
            run.origin === "community" && !run.submitter,
            "community runs need submitter (GitHub handle)",
        ],
        [
            run.dataMethod !== "raw",
            `${run.origin} runs must be raw data (dataMethod "raw")`,
        ],
        [run.rig.accuracyPct === null, "rig.accuracyPct is required"],
        [run.rig.ambientC === null, "rig.ambientC is required"],
        [run.rig.busV === null, "rig.busV is required"],
        [
            (run.torqueSpeed?.length ?? 0) < MIN_TN_POINTS,
            `core measurement missing: torqueSpeed needs at least ${MIN_TN_POINTS} points`,
        ],
        [
            (run.thermal?.length ?? 0) < MIN_THERMAL_POINTS,
            `core measurement missing: thermal needs at least ${MIN_THERMAL_POINTS} points`,
        ],
        [
            Boolean(run.thermal?.some((p) => p.windingRiseC === undefined)),
            "every thermal point needs windingRiseC",
        ],
    ];
    return checks.filter(([bad]) => bad).map(([, message]) => message);
}

const originErrors = (run: BenchmarkRun) =>
    run.origin === "published" ? publishedErrors(run) : protocolErrors(run);

function uncertaintyErrors(run: BenchmarkRun): string[] {
    const reported = reportedMetrics(run);
    const errors = reported
        .filter((k) => !(k in run.uncertainty))
        .map((k) => `uncertainty.${k} is missing (one per reported metric)`);
    for (const k of Object.keys(run.uncertainty))
        if (!(METRIC_KEYS as string[]).includes(k) || !reported.includes(k as never))
            errors.push(`uncertainty.${k} does not match a reported metric`);
    return errors;
}

// T-N points by ascending rpm, torque never rising by more than the stated
// uncertainty (a monotonic envelope).
function curveErrors(run: BenchmarkRun): string[] {
    const errors: string[] = [];
    const tol = run.uncertainty.torqueSpeed ?? 0;
    const tn = run.torqueSpeed ?? [];
    tn.forEach((p, i) => {
        const prev = tn[i - 1];
        if (!prev) return;
        if (p.rpm <= prev.rpm)
            errors.push(
                `torqueSpeed[${i}]: rpm must rise strictly (${prev.rpm} then ${p.rpm})`,
            );
        if (p.torqueNm > prev.torqueNm + tol)
            errors.push(
                `torqueSpeed[${i}]: torque rises from ${prev.torqueNm} to ${p.torqueNm} N·m with speed; the T-N envelope must not rise`,
            );
    });
    const th = run.thermal ?? [];
    th.forEach((p, i) => {
        const prev = th[i - 1];
        if (!prev) return;
        if (p.torqueNm >= prev.torqueNm)
            errors.push(`thermal[${i}]: list torques from highest to lowest`);
        const a = prev.tToLimitS ?? Number.POSITIVE_INFINITY;
        const b = p.tToLimitS ?? Number.POSITIVE_INFINITY;
        if (a === Number.POSITIVE_INFINITY && i > 0)
            errors.push(
                `thermal[${i - 1}]: only the lowest torque may be continuous (null)`,
            );
        else if (b < a)
            errors.push(
                `thermal[${i}]: lower torque must last at least as long (${a} s then ${b} s)`,
            );
    });
    return errors;
}

function plausibilityErrors(run: BenchmarkRun, actuator: CatalogEntry): string[] {
    const peak = measuredPeak(run);
    const sheet = actuator.peak_torque_nm;
    if (peak === undefined || !sheet || run.plausibilityNote) return [];
    const r = peak / sheet;
    const [lo, hi] = PLAUSIBLE_PEAK_RATIO;
    return r < lo || r > hi
        ? [
              `measured peak ${peak} N·m is ${r.toFixed(2)}x the ${sheet} N·m datasheet peak (allowed ${lo}x to ${hi}x); check units, or explain it in plausibilityNote`,
          ]
        : [];
}

// Columns that may be blank: efficiency when not measured, and the time of a
// continuous (limit not reached) thermal point.
const OPTIONAL_COLUMNS = new Set(["efficiency", "t_to_limit_s"]);

function cellOk(cell: string, column: string): boolean {
    const c = cell.trim();
    if (c === "") return OPTIONAL_COLUMNS.has(column);
    return Number.isFinite(Number(c));
}

function csvErrors(text: string, header: readonly string[], name: string): string[] {
    const lines = text.trim().split(/\r?\n/);
    const head = (lines[0] ?? "").split(",").map((s) => s.trim());
    if (head.join(",") !== header.join(","))
        return [`${name}: header must be ${header.join(",")}`];
    if (lines.length < 2) return [`${name}: no data rows`];
    const errors: string[] = [];
    lines.slice(1).forEach((line, i) => {
        const cells = line.split(",");
        if (cells.length !== header.length)
            errors.push(`${name} row ${i + 2}: expected ${header.length} columns`);
        else if (!cells.every((c, j) => cellOk(c, header[j] ?? "")))
            errors.push(`${name} row ${i + 2}: values must be numbers`);
    });
    return errors;
}

function rawFileErrors(run: BenchmarkRun, folder: RunFolder): string[] {
    if (run.origin === "published") return [];
    const errors: string[] = [];
    for (const [file, header, points] of [
        [TN_CSV, TN_CSV_HEADER, run.torqueSpeed?.length ?? 0],
        [THERMAL_CSV, THERMAL_CSV_HEADER, run.thermal?.length ?? 0],
    ] as const) {
        if (!folder.files.includes(file)) {
            errors.push(`missing raw data ${file}`);
            continue;
        }
        const text = folder.read(file);
        errors.push(...csvErrors(text, header, file));
        if (text.trim().split(/\r?\n/).length - 1 < points)
            errors.push(`${file} has fewer rows than run.json has points`);
    }
    if (!folder.files.includes(RIG_DOC))
        errors.push(`missing ${RIG_DOC} (rig description)`);
    if (!folder.files.some((f) => PHOTO.test(f)))
        errors.push("missing a rig photo (rig.jpg, rig.png or rig.webp)");
    return errors;
}

export function validateFolder(
    folder: RunFolder,
    catalog: readonly CatalogEntry[],
    today: string,
): Checked {
    const parsed = parseRun(folder);
    const run = parsed.run;
    if (!run) return parsed;
    const errors: string[] = [];
    if (run.actuatorId !== folder.actuatorId)
        errors.push(
            `actuatorId "${run.actuatorId}" does not match folder "${folder.actuatorId}"`,
        );
    if (run.runId !== folder.runId)
        errors.push(`runId "${run.runId}" does not match folder "${folder.runId}"`);
    const actuator = catalog.find((a) => a.id === run.actuatorId);
    if (!actuator) errors.push(`actuator "${run.actuatorId}" is not in the catalog`);
    errors.push(...dateErrors(run.date, today));
    errors.push(...originErrors(run));
    if (run.dataMethod === "digitised" && !run.methodNote)
        errors.push("digitised runs need methodNote saying how the plot was read");
    errors.push(...uncertaintyErrors(run));
    errors.push(...curveErrors(run));
    if (actuator) errors.push(...plausibilityErrors(run, actuator));
    errors.push(...rawFileErrors(run, folder));
    return { run, errors };
}

export function benchmarkLicenceErrors(runs: readonly BenchmarkRun[]): string[] {
    const citations: Citation[] = runs.flatMap((r) => {
        const id = r.source ? sourceIdForUrl(r.source.url) : undefined;
        return id ? [[`benchmark ${r.actuatorId}/${r.runId}`, [id]] as Citation] : [];
    });
    return licenceErrors({
        name: "benchmarks",
        file: "src/benchmarks/sources.ts",
        sources: Object.entries(BENCHMARK_SOURCES).map(([id, s]) => ({ id, ...s })),
        citations,
        allowlist: BENCHMARK_FACTS_ALLOWLIST,
    });
}

// The generated import list for src/benchmarks/runs.generated.ts.
export function runsModule(
    folders: readonly { actuatorId: string; runId: string }[],
): string {
    const sorted = [...folders].sort(
        (a, b) =>
            a.actuatorId.localeCompare(b.actuatorId) || a.runId.localeCompare(b.runId),
    );
    const imports = sorted
        .map(
            (f, i) =>
                `import r${i} from "../../data/benchmarks/${f.actuatorId}/${f.runId}/run.json";`,
        )
        .join("\n");
    return `// Generated by \`bun run scripts/validate-benchmarks.ts --write\` from
// data/benchmarks/*/*/run.json. Do not edit by hand; the validator in
// \`make ci\` fails when this list is out of date.
${imports}
import type { BenchmarkRun } from "./types";

export const RUNS = [${sorted.map((_, i) => `r${i}`).join(", ")}] as unknown as BenchmarkRun[];
`;
}
