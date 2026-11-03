import { describe, expect, test } from "bun:test";
import {
    BENCHMARK_RUNS,
    benchmarkedIds,
    continuousTorque,
    datasheetDeltas,
    measuredLeaderboard,
    runsFor,
} from "@/benchmarks";
import { BENCHMARK_SOURCES, sourceIdForUrl } from "@/benchmarks/sources";
import {
    type RunFolder,
    benchmarkLicenceErrors,
    runsModule,
    validateFolder,
} from "@/benchmarks/validate";
import { ACTUATORS } from "@/catalog";

const TODAY = "2026-11-03";

// A complete community run on the CyberGear (12 N·m datasheet peak).
function communityRun(): Record<string, unknown> {
    return {
        actuatorId: "xiaomi-cybergear",
        runId: "dyno-24v-2026-10",
        date: "2026-10-20",
        origin: "community",
        submitter: "octocat",
        dataMethod: "raw",
        rig: {
            torqueSensor: "Example 20 N·m inline rotary transducer",
            accuracyPct: 0.2,
            encoder: "external 17-bit encoder",
            ambientC: 23,
            busV: 24,
            controller: "built-in driver",
            firmware: "1.2.1.5",
        },
        torqueSpeed: [
            { rpm: 20, torqueNm: 11.5, efficiency: 0.4 },
            { rpm: 100, torqueNm: 11.4, efficiency: 0.7 },
            { rpm: 160, torqueNm: 9.5, efficiency: 0.78 },
            { rpm: 220, torqueNm: 5.1, efficiency: 0.74 },
            { rpm: 280, torqueNm: 0.6, efficiency: 0.3 },
        ],
        thermal: [
            { torqueNm: 10, tToLimitS: 55, windingRiseC: 95 },
            { torqueNm: 7, tToLimitS: 300, windingRiseC: 95 },
            { torqueNm: 4, tToLimitS: null, windingRiseC: 61 },
        ],
        backlashArcmin: 18,
        uncertainty: { torqueSpeed: 0.1, thermal: 0.1, backlashArcmin: 2 },
    };
}

const TN_CSV =
    "rpm,torque_nm,efficiency\n20,11.5,0.4\n100,11.4,0.7\n160,9.5,0.78\n220,5.1,0.74\n280,0.6,0.3\n";
const THERMAL_CSV =
    "torque_nm,t_to_limit_s,winding_rise_c\n10,55,95\n7,300,95\n4,,61\n";

function folder(
    run: Record<string, unknown>,
    extra: Record<string, string> = {},
    drop: string[] = [],
): RunFolder {
    const files: Record<string, string> = {
        "run.json": JSON.stringify(run),
        "torque-speed.csv": TN_CSV,
        "thermal.csv": THERMAL_CSV,
        "rig.md": "Inline transducer, steel coupling, hysteresis brake, still air.",
        "rig.jpg": "",
        ...extra,
    };
    for (const f of drop) delete files[f];
    return {
        actuatorId: String(run.actuatorId),
        runId: String(run.runId),
        files: Object.keys(files),
        read: (name) => files[name] ?? "",
    };
}

const errorsFor = (f: RunFolder) => validateFolder(f, ACTUATORS, TODAY).errors;

describe("benchmark validator", () => {
    test("a complete community run passes", () => {
        expect(errorsFor(folder(communityRun()))).toEqual([]);
    });

    test("schema, units and folder names", () => {
        const bad = {
            ...communityRun(),
            torqueSpeed: [{ rpm: 10, torqueNm: 5, efficiency: 1.2 }],
        };
        expect(errorsFor(folder(bad)).join("\n")).toContain("torqueSpeed.0.efficiency");
        const unknownKey = { ...communityRun(), peakTorqueKgCm: 120 };
        expect(errorsFor(folder(unknownKey)).join("\n")).toContain("Unrecognized key");
        const f = folder(communityRun());
        expect(errorsFor({ ...f, runId: "other-run" }).join("\n")).toContain(
            'does not match folder "other-run"',
        );
        expect(
            errorsFor(
                folder({ ...communityRun(), actuatorId: "made-up-actuator" }),
            ).join("\n"),
        ).toContain("not in the catalog");
        expect(
            errorsFor(folder({ ...communityRun(), date: "2027-01-01" })).join("\n"),
        ).toContain("in the future");
        expect(
            errorsFor(folder({ ...communityRun(), date: "2026-02-30" })).join("\n"),
        ).toContain("not a calendar date");
    });

    test("core measurements, minimum samples and raw files for community runs", () => {
        const run = communityRun();
        const noThermal = {
            ...run,
            thermal: undefined,
            uncertainty: { torqueSpeed: 0.1, backlashArcmin: 2 },
        };
        expect(errorsFor(folder(noThermal)).join("\n")).toContain(
            "core measurement missing: thermal",
        );
        const fewPoints = {
            ...run,
            torqueSpeed: (run.torqueSpeed as unknown[]).slice(0, 3),
        };
        expect(errorsFor(folder(fewPoints)).join("\n")).toContain("at least 5 points");
        expect(
            errorsFor(folder({ ...run, submitter: undefined })).join("\n"),
        ).toContain("submitter");
        expect(
            errorsFor(folder({ ...run, dataMethod: "digitised" })).join("\n"),
        ).toContain('"raw"');
        const noAmbient = { ...run, rig: { ...(run.rig as object), ambientC: null } };
        expect(errorsFor(folder(noAmbient)).join("\n")).toContain(
            "rig.ambientC is required",
        );
        const missing = errorsFor(
            folder(run, {}, ["thermal.csv", "rig.jpg", "rig.md"]),
        ).join("\n");
        expect(missing).toContain("missing raw data thermal.csv");
        expect(missing).toContain("rig photo");
        expect(missing).toContain("rig.md");
        expect(
            errorsFor(folder(run, { "torque-speed.csv": "speed,torque\n1,2\n" })).join(
                "\n",
            ),
        ).toContain("header must be rpm,torque_nm,efficiency");
        expect(
            errorsFor(
                folder(run, {
                    "thermal.csv": "torque_nm,t_to_limit_s,winding_rise_c\n10,abc,95\n",
                }),
            ).join("\n"),
        ).toContain("values must be numbers");
    });

    test("uncertainty per reported metric, and no stray keys", () => {
        const run = communityRun();
        const missing = { ...run, uncertainty: { torqueSpeed: 0.1, thermal: 0.1 } };
        expect(errorsFor(folder(missing)).join("\n")).toContain(
            "uncertainty.backlashArcmin is missing",
        );
        const stray = {
            ...run,
            uncertainty: { ...(run.uncertainty as object), latencyMs: 1 },
        };
        expect(errorsFor(folder(stray)).join("\n")).toContain(
            "uncertainty.latencyMs does not match",
        );
    });

    test("monotonic T-N envelope and ordered thermal points", () => {
        const run = communityRun();
        const rising = {
            ...run,
            torqueSpeed: [
                { rpm: 20, torqueNm: 8 },
                { rpm: 100, torqueNm: 11.5 },
                { rpm: 160, torqueNm: 9.5 },
                { rpm: 220, torqueNm: 5.1 },
                { rpm: 280, torqueNm: 0.6 },
            ],
        };
        expect(errorsFor(folder(rising)).join("\n")).toContain(
            "T-N envelope must not rise",
        );
        const unsorted = {
            ...run,
            thermal: [
                { torqueNm: 4, tToLimitS: null, windingRiseC: 61 },
                { torqueNm: 10, tToLimitS: 55, windingRiseC: 95 },
                { torqueNm: 7, tToLimitS: 300, windingRiseC: 95 },
            ],
        };
        const errs = errorsFor(folder(unsorted)).join("\n");
        expect(errs).toContain("highest to lowest");
        expect(errs).toContain("only the lowest torque may be continuous");
    });

    test("peak torque within 0.3x to 1.5x the datasheet unless explained", () => {
        const run = communityRun();
        const kgcm = {
            ...run,
            torqueSpeed: (run.torqueSpeed as { rpm: number; torqueNm: number }[]).map(
                (p) => ({ ...p, torqueNm: p.torqueNm * 10.2 }),
            ),
            thermal: [
                { torqueNm: 100, tToLimitS: 55, windingRiseC: 95 },
                { torqueNm: 70, tToLimitS: 300, windingRiseC: 95 },
                { torqueNm: 40, tToLimitS: null, windingRiseC: 61 },
            ],
            uncertainty: { torqueSpeed: 1, thermal: 1, backlashArcmin: 2 },
        };
        expect(errorsFor(folder(kgcm)).join("\n")).toContain(
            "datasheet peak (allowed 0.3x to 1.5x)",
        );
        const explained = {
            ...kgcm,
            plausibilityNote:
                "Firmware raised the current limit to 60 A for this test run.",
        };
        expect(errorsFor(folder(explained)).join("\n")).not.toContain("datasheet peak");
    });

    test("published runs need a registered source and a metric", () => {
        const pub = {
            actuatorId: "xiaomi-cybergear",
            runId: "some-paper-2026",
            date: "2026",
            origin: "published",
            sourceKind: "paper",
            source: { url: "https://example.org/unregistered", title: "Some paper" },
            dataMethod: "digitised",
            rig: {
                torqueSensor: "not stated",
                accuracyPct: null,
                encoder: "own",
                ambientC: null,
                busV: null,
                controller: "own",
            },
            peakTorqueNm: 11,
            uncertainty: { peakTorqueNm: 0.5 },
        };
        const errs = errorsFor(
            folder(pub, {}, ["torque-speed.csv", "thermal.csv", "rig.md", "rig.jpg"]),
        ).join("\n");
        expect(errs).toContain("not in src/benchmarks/sources.ts");
        expect(errs).toContain("digitised runs need methodNote");
        expect(errs).not.toContain("raw data");
        const empty = { ...pub, peakTorqueNm: undefined, uncertainty: {} };
        expect(errorsFor(folder(empty, {}, [])).join("\n")).toContain(
            "at least one metric",
        );
    });

    test("generated module imports every folder", () => {
        const text = runsModule([
            { actuatorId: "robstride-02", runId: "b-run" },
            { actuatorId: "cubemars-ak80-9", runId: "a-run" },
        ]);
        expect(text.indexOf("cubemars-ak80-9/a-run")).toBeLessThan(
            text.indexOf("robstride-02/b-run"),
        );
        expect(text).toContain("export const RUNS = [r0, r1]");
    });
});

describe("seeded benchmark data", () => {
    test("at least 15 catalog actuators, every published run linked to a registered source", () => {
        expect(benchmarkedIds().length).toBeGreaterThanOrEqual(15);
        for (const id of benchmarkedIds())
            expect(ACTUATORS.some((a) => a.id === id)).toBe(true);
        for (const r of BENCHMARK_RUNS.filter((x) => x.origin === "published")) {
            const id = r.source ? sourceIdForUrl(r.source.url) : undefined;
            expect(id, `${r.actuatorId}/${r.runId}`).toBeDefined();
            if (id) expect(BENCHMARK_SOURCES[id].title).toBeTruthy();
        }
        expect(benchmarkLicenceErrors(BENCHMARK_RUNS)).toEqual([]);
    });

    test("digitised runs say so and carry an uncertainty for every curve", () => {
        for (const r of BENCHMARK_RUNS.filter((x) => x.dataMethod === "digitised")) {
            expect(r.methodNote).toBeTruthy();
            if (r.torqueSpeed) expect(r.uncertainty.torqueSpeed).toBeGreaterThan(0);
        }
    });

    test("deltas, leaderboard and continuous torque", () => {
        const deltas = datasheetDeltas(ACTUATORS);
        const ratios = deltas.map((d) => d.peak?.ratio ?? 0);
        expect(ratios).toEqual([...ratios].sort((a, b) => a - b));
        expect(deltas[0]?.actuator.id).toBe("steadywin-gim6010-8");
        const board = measuredLeaderboard(ACTUATORS);
        expect(board[0]?.actuator.id).toBe("robstride-04");
        // Other-revision runs are not ranked: the qdd100 ranks on beta 3 data.
        expect(board.find((r) => r.actuator.id === "mjbots-qdd100")?.run.runId).toBe(
            "mjbots-beta3-spec",
        );
        const cg = runsFor("xiaomi-cybergear")[0];
        if (!cg) throw new Error("no CyberGear run");
        expect(continuousTorque(cg)).toBe(6);
    });
});
