import { z } from "zod";
import { type Citation, licenceErrors } from "../supply-chain/licence";
import { PLAUSIBLE_PEAK_RATIO, highestTorque, reportedMetrics } from "./measures";
import {
    BENCHMARK_FACTS_ALLOWLIST,
    BENCHMARK_SOURCES,
    sourceIdForUrl,
} from "./sources";
import {
    BENCHMARK_ORIGINS,
    type BenchmarkRun,
    DATA_METHODS,
    SOURCE_KINDS,
} from "./types";

// Validation of benchmark submissions, run by scripts/validate-benchmarks.ts
// in `make ci`: schema and units, folder layout, catalog link, protocol
// (core measurements and minimum samples for lab and community runs), raw
// files and their agreement with run.json, plausibility against the
// datasheet, and source licences. Server and
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
// Torque transducer accuracy class a lab or community rig must meet, % FS.
export const MAX_ACCURACY_PCT = 0.5;
// rig.md must say something: at least this many non-space characters.
const MIN_RIG_DOC_CHARS = 40;

// Folder names, which are also the ids in run.json and the import paths in
// the generated module.
export const ACTUATOR_ID_RE = /^[a-z0-9][a-z0-9-]*$/;
export const RUN_ID_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;

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
        actuatorId: z.string().regex(ACTUATOR_ID_RE),
        runId: z.string().regex(RUN_ID_RE),
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
        notRanked: z.string().min(20).optional(),
        rig: rigSchema,
        torqueSpeed: z
            .array(
                z
                    .object({
                        rpm: nonNeg(20000),
                        torqueNm: nonNeg(5000),
                        efficiency: nonNeg(1).optional(),
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
    if (run.dataMethod === "raw")
        errors.push(
            'published runs are tabulated, digitised or reported, never "raw"; raw data belongs to lab and community runs',
        );
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
        [
            (run.rig.accuracyPct ?? 0) > MAX_ACCURACY_PCT,
            `rig.accuracyPct must be ${MAX_ACCURACY_PCT}% of full scale or better`,
        ],
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

function originErrors(run: BenchmarkRun): string[] {
    const errors =
        run.origin === "published" ? publishedErrors(run) : protocolErrors(run);
    if (run.origin !== "community" && run.submitter)
        errors.push("submitter is for community runs only");
    return errors;
}

// One uncertainty per reported metric. Efficiency on the T-N points has its
// own key, `efficiency` (a fraction): required for lab and community runs,
// optional for a published run, whose methodNote must then say it is not
// quantified.
function uncertaintyErrors(run: BenchmarkRun): string[] {
    const reported: string[] = reportedMetrics(run);
    const hasEfficiency = Boolean(
        run.torqueSpeed?.some((p) => p.efficiency !== undefined),
    );
    const errors = reported
        .filter((k) => !(k in run.uncertainty))
        .map((k) => `uncertainty.${k} is missing (one per reported metric)`);
    if (
        hasEfficiency &&
        !("efficiency" in run.uncertainty) &&
        run.origin !== "published"
    )
        errors.push("uncertainty.efficiency is missing (efficiency is reported)");
    for (const k of Object.keys(run.uncertainty))
        if (k === "efficiency" ? !hasEfficiency : !reported.includes(k))
            errors.push(`uncertainty.${k} does not match a reported metric`);
    return errors;
}

// T-N points by ascending rpm, torque never rising more than the stated
// uncertainty above the lowest torque seen at a lower speed (a monotonic
// envelope; comparing with the running minimum stops small steps adding up).
function curveErrors(run: BenchmarkRun): string[] {
    const errors: string[] = [];
    const tol = run.uncertainty.torqueSpeed ?? 0;
    const tn = run.torqueSpeed ?? [];
    let floor = Number.POSITIVE_INFINITY;
    tn.forEach((p, i) => {
        const prev = tn[i - 1];
        if (prev && p.rpm <= prev.rpm)
            errors.push(
                `torqueSpeed[${i}]: rpm must rise strictly (${prev.rpm} then ${p.rpm})`,
            );
        if (p.torqueNm > floor + tol)
            errors.push(
                `torqueSpeed[${i}]: torque rises from ${floor} to ${p.torqueNm} N·m with speed; the T-N envelope must not rise`,
            );
        floor = Math.min(floor, p.torqueNm);
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
    const peak = highestTorque(run);
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

// Allowed range per raw CSV column (the run.json bounds), and the columns
// that may be blank: efficiency when not measured, and the time of a
// continuous (limit not reached) thermal point.
// Each entry: [lowest, highest, may be blank, lowest excluded].
const COLUMN_RANGE: Record<string, [number, number, boolean, boolean]> = {
    rpm: [0, 20000, false, false],
    torque_nm: [0, 5000, false, false],
    efficiency: [0, 1, true, false],
    t_to_limit_s: [0, 1e6, true, true],
    winding_rise_c: [0, 250, false, true],
};
// thermal.csv torques, like run.json thermal torques, must be above zero.
const THERMAL_TORQUE_RANGE: [number, number, boolean, boolean] = [0, 5000, false, true];

type Row = (number | null)[];

function cellError(cell: string, column: string, file: string): string | undefined {
    const c = cell.trim();
    const [lo, hi, optional, open] =
        file === THERMAL_CSV && column === "torque_nm"
            ? THERMAL_TORQUE_RANGE
            : (COLUMN_RANGE[column] ?? [0, 0, false, false]);
    if (c === "") return optional ? undefined : `${column} is blank`;
    const v = Number(c);
    if (!Number.isFinite(v)) return "values must be numbers";
    const low = open ? v <= lo : v < lo;
    return low || v > hi
        ? `${column} ${c} must be ${open ? "above" : "at least"} ${lo} and at most ${hi}`
        : undefined;
}

function parseCsv(
    text: string,
    header: readonly string[],
    name: string,
): { rows: Row[]; errors: string[] } {
    const lines = text.trim().split(/\r?\n/);
    const head = (lines[0] ?? "").split(",").map((s) => s.trim());
    if (head.join(",") !== header.join(","))
        return { rows: [], errors: [`${name}: header must be ${header.join(",")}`] };
    if (lines.length < 2) return { rows: [], errors: [`${name}: no data rows`] };
    const errors: string[] = [];
    const rows: Row[] = [];
    lines.slice(1).forEach((line, i) => {
        const cells = line.split(",");
        if (cells.length !== header.length) {
            errors.push(`${name} row ${i + 2}: expected ${header.length} columns`);
            return;
        }
        const bad = cells
            .map((c, j) => cellError(c, header[j] ?? "", name))
            .find(Boolean);
        if (bad) errors.push(`${name} row ${i + 2}: ${bad}`);
        else rows.push(cells.map((c) => (c.trim() === "" ? null : Number(c))));
    });
    return { rows, errors };
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const nums = (rows: Row[], col: number) =>
    rows.map((r) => r[col]).filter((v): v is number => typeof v === "number");

// Every T-N point in run.json needs CSV rows at its speed (within 0.5 rpm)
// whose mean torque is within the stated torqueSpeed uncertainty.
function tnAgreement(run: BenchmarkRun, rows: Row[]): string[] {
    const tol = run.uncertainty.torqueSpeed ?? 0;
    return (run.torqueSpeed ?? []).flatMap((p, i) => {
        const at = rows.filter((r) => Math.abs((r[0] ?? Number.NaN) - p.rpm) <= 0.5);
        if (at.length === 0)
            return [`${TN_CSV} has no rows at ${p.rpm} rpm (torqueSpeed[${i}])`];
        const m = mean(nums(at, 1));
        return Math.abs(m - p.torqueNm) > tol + 1e-9
            ? [
                  `torqueSpeed[${i}]: ${p.torqueNm} N·m disagrees with the ${TN_CSV} mean ${Number(m.toPrecision(4))} N·m at ${p.rpm} rpm (beyond ±${tol})`,
              ]
            : [];
    });
}

// Every thermal point needs CSV rows at its torque (within the thermal
// uncertainty); its time and winding rise must lie within those rows' range,
// and a continuous point (null time) needs blank times.
function thermalAgreement(run: BenchmarkRun, rows: Row[]): string[] {
    const tol = run.uncertainty.thermal ?? 0;
    const within = (v: number, xs: number[]) =>
        xs.length > 0 && v >= Math.min(...xs) - 1e-9 && v <= Math.max(...xs) + 1e-9;
    return (run.thermal ?? []).flatMap((p, i) => {
        const at = rows.filter(
            (r) => Math.abs((r[0] ?? Number.NaN) - p.torqueNm) <= tol + 1e-9,
        );
        if (at.length === 0)
            return [`${THERMAL_CSV} has no rows at ${p.torqueNm} N·m (thermal[${i}])`];
        const errors: string[] = [];
        const times = nums(at, 1);
        if (p.tToLimitS === null ? times.length > 0 : times.length < at.length)
            errors.push(
                `thermal[${i}]: ${THERMAL_CSV} must leave t_to_limit_s blank exactly when run.json has null`,
            );
        else if (p.tToLimitS !== null && !within(p.tToLimitS, times))
            errors.push(
                `thermal[${i}]: ${p.tToLimitS} s is outside the ${THERMAL_CSV} times at ${p.torqueNm} N·m`,
            );
        if (p.windingRiseC !== undefined && !within(p.windingRiseC, nums(at, 2)))
            errors.push(
                `thermal[${i}]: winding rise ${p.windingRiseC} °C is outside the ${THERMAL_CSV} readings at ${p.torqueNm} N·m`,
            );
        return errors;
    });
}

function rawFileErrors(run: BenchmarkRun, folder: RunFolder): string[] {
    if (run.origin === "published") return [];
    const errors: string[] = [];
    for (const [file, header, agree] of [
        [TN_CSV, TN_CSV_HEADER, tnAgreement],
        [THERMAL_CSV, THERMAL_CSV_HEADER, thermalAgreement],
    ] as const) {
        if (!folder.files.includes(file)) {
            errors.push(`missing raw data ${file}`);
            continue;
        }
        const parsed = parseCsv(folder.read(file), header, file);
        errors.push(...parsed.errors);
        if (parsed.errors.length === 0) errors.push(...agree(run, parsed.rows));
    }
    if (!folder.files.includes(RIG_DOC))
        errors.push(`missing ${RIG_DOC} (rig description)`);
    else if (folder.read(RIG_DOC).replace(/\s/g, "").length < MIN_RIG_DOC_CHARS)
        errors.push(
            `${RIG_DOC} must describe the coupling, load, cooling and controller`,
        );
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

// Folder names that cannot become ids or import paths.
export function folderNameErrors(
    folders: readonly { actuatorId: string; runId: string }[],
): string[] {
    return folders.flatMap((f) =>
        ACTUATOR_ID_RE.test(f.actuatorId) && RUN_ID_RE.test(f.runId)
            ? []
            : [
                  `data/benchmarks/${JSON.stringify(f.actuatorId)}/${JSON.stringify(f.runId)}: folder names must be lowercase letters, digits and hyphens`,
              ],
    );
}

// The generated import list for src/benchmarks/runs.generated.ts. Refuses
// folder names outside the id patterns, and quotes each import specifier
// with JSON.stringify, so a folder name can never inject code.
export function runsModule(
    folders: readonly { actuatorId: string; runId: string }[],
): string {
    const bad = folderNameErrors(folders);
    if (bad.length > 0) throw new Error(bad.join("\n"));
    const sorted = [...folders].sort(
        (a, b) =>
            a.actuatorId.localeCompare(b.actuatorId) || a.runId.localeCompare(b.runId),
    );
    const imports = sorted
        .map(
            (f, i) =>
                `import r${i} from ${JSON.stringify(`../../data/benchmarks/${f.actuatorId}/${f.runId}/run.json`)};`,
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

// True when two versions of the generated module say the same thing, ignoring
// the line breaks and trailing commas that make fmt adds.
export function sameModule(a: string, b: string): boolean {
    const norm = (t: string) => t.replace(/\s+/g, "").replace(/,\]/g, "]");
    return norm(a) === norm(b);
}
