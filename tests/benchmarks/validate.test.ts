import { describe, expect, test } from "bun:test";
import {
    BENCHMARK_RUNS,
    type BenchmarkRun,
    benchmarkedIds,
    continuousTorque,
    datasheetDelta,
    datasheetDeltas,
    getRun,
    measuredLeaderboard,
    measuredNoLoad,
    runsFor,
} from "@/benchmarks";
import { BENCHMARK_SOURCES, sourceIdForUrl } from "@/benchmarks/sources";
import {
    type RunFolder,
    benchmarkLicenceErrors,
    runsModule,
    sameModule,
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
        uncertainty: {
            torqueSpeed: 0.1,
            efficiency: 0.02,
            thermal: 0.1,
            backlashArcmin: 2,
        },
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

const runKeyOf = (r: BenchmarkRun) => `${r.actuatorId}/${r.runId}`;
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
        expect(
            errorsFor(
                folder(run, {
                    "torque-speed.csv": TN_CSV.replace("0.78", "1.4"),
                }),
            ).join("\n"),
        ).toContain("efficiency 1.4 must be at least 0 and at most 1");
        expect(errorsFor(folder(run, { "rig.md": "rig" })).join("\n")).toContain(
            "rig.md must describe",
        );
        expect(
            errorsFor(folder(run, { "thermal.csv": `${THERMAL_CSV}0,10,5\n` })).join(
                "\n",
            ),
        ).toContain("torque_nm 0 must be above 0");
        const coarse = { ...run, rig: { ...(run.rig as object), accuracyPct: 2 } };
        expect(errorsFor(folder(coarse)).join("\n")).toContain(
            "0.5% of full scale or better",
        );
    });

    test("raw CSVs must agree with run.json", () => {
        const run = communityRun();
        // A T-N torque off the CSV mean by more than the uncertainty.
        const tn = errorsFor(
            folder(run, { "torque-speed.csv": TN_CSV.replace("160,9.5", "160,8.9") }),
        ).join("\n");
        expect(tn).toContain("torqueSpeed[2]: 9.5 N·m disagrees");
        // A speed with no CSV rows at all.
        expect(
            errorsFor(
                folder(run, { "torque-speed.csv": TN_CSV.replace("220,", "230,") }),
            ).join("\n"),
        ).toContain("no rows at 220 rpm");
        // The mean of repeats within the uncertainty passes.
        const repeats = `${TN_CSV}160,9.45,0.78\n160,9.55,0.78\n`;
        expect(errorsFor(folder(run, { "torque-speed.csv": repeats }))).toEqual([]);
        // Thermal time outside the readings, and a continuous point with a time.
        const th = errorsFor(
            folder(run, {
                "thermal.csv": THERMAL_CSV.replace("10,55,95", "10,80,95").replace(
                    "4,,61",
                    "4,2000,61",
                ),
            }),
        ).join("\n");
        expect(th).toContain("thermal[0]: 55 s is outside");
        expect(th).toContain("thermal[2]: thermal.csv must leave t_to_limit_s blank");
    });

    test("submitter, raw data and efficiency rules by origin", () => {
        const lab = { ...communityRun(), origin: "lab" };
        expect(errorsFor(folder(lab)).join("\n")).toContain(
            "submitter is for community runs only",
        );
        expect(errorsFor(folder({ ...lab, submitter: undefined }))).toEqual([]);
        const zeroRpm = {
            ...communityRun(),
            torqueSpeed: [
                { rpm: 0, torqueNm: 11.5, efficiency: 0 },
                ...(communityRun().torqueSpeed as unknown[]).slice(1),
            ],
        };
        const zeroCsv = TN_CSV.replace("20,11.5,0.4", "0,11.5,0");
        expect(errorsFor(folder(zeroRpm, { "torque-speed.csv": zeroCsv }))).toEqual([]);
    });

    test("uncertainty per reported metric, and no stray keys", () => {
        const run = communityRun();
        const missing = { ...run, uncertainty: { torqueSpeed: 0.1, thermal: 0.1 } };
        const missingErrs = errorsFor(folder(missing)).join("\n");
        expect(missingErrs).toContain("uncertainty.backlashArcmin is missing");
        expect(missingErrs).toContain("uncertainty.efficiency is missing");
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
        // Small steps, each within the uncertainty, still may not add up.
        const creeping = {
            ...run,
            torqueSpeed: [
                { rpm: 20, torqueNm: 11 },
                { rpm: 100, torqueNm: 11.08 },
                { rpm: 160, torqueNm: 11.16 },
                { rpm: 220, torqueNm: 5.1 },
                { rpm: 280, torqueNm: 0.6 },
            ],
        };
        expect(errorsFor(folder(creeping)).join("\n")).toContain(
            "torqueSpeed[2]: torque rises from 11 to 11.16",
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
        // A stated peak lower than the curves does not hide a slip in them.
        const hidden = {
            ...kgcm,
            peakTorqueNm: 11,
            uncertainty: { ...kgcm.uncertainty, peakTorqueNm: 0.5 },
        };
        expect(errorsFor(folder(hidden)).join("\n")).toContain("datasheet peak");
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
        const raw = errorsFor(
            folder({ ...pub, dataMethod: "raw", submitter: "octocat" }, {}, []),
        ).join("\n");
        expect(raw).toContain('never "raw"');
        expect(raw).toContain("submitter is for community runs only");
        // Published efficiency needs an uncertainty or a "not quantified" note.
        const sourceUrl = BENCHMARK_RUNS.find(
            (r) => r.actuatorId === "xiaomi-cybergear",
        )?.source?.url;
        const withEff = {
            ...pub,
            source: { url: sourceUrl, title: "Registered source" },
            methodNote: "Points read off the maker's chart by eye.",
            torqueSpeed: [
                { rpm: 10, torqueNm: 11, efficiency: 0.2 },
                { rpm: 100, torqueNm: 8, efficiency: 0.6 },
            ],
            uncertainty: { peakTorqueNm: 0.5, torqueSpeed: 0.2 },
        };
        const noEffNote = "efficiency has no uncertainty";
        expect(errorsFor(folder(withEff, {}, [])).join("\n")).toContain(noEffNote);
        const noted = {
            ...withEff,
            methodNote: `${withEff.methodNote} The efficiency reading error is not quantified.`,
        };
        expect(errorsFor(folder(noted, {}, [])).join("\n")).not.toContain(noEffNote);
        const given = {
            ...withEff,
            uncertainty: { ...withEff.uncertainty, efficiency: 0.02 },
        };
        expect(errorsFor(folder(given, {}, [])).join("\n")).not.toContain(noEffNote);
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
        expect(text).toContain(
            'import r0 from "../../data/benchmarks/cubemars-ak80-9/a-run/run.json";',
        );
        // A folder name that could break out of the string is refused.
        expect(() =>
            runsModule([{ actuatorId: 'x";process.exit(1);"', runId: "a-run" }]),
        ).toThrow("folder names must be");
        // Formatting does not matter, a dropped binding does.
        const formatted = text
            .replace("[r0, r1]", "[\n    r0,\n    r1,\n]")
            .replace(/\n/g, "\n\n");
        expect(sameModule(text, formatted)).toBe(true);
        expect(sameModule(text, text.replace("[r0, r1]", "[r0]"))).toBe(false);
    });
});

describe("seeded benchmark data", () => {
    test("16 catalog actuators, every published run linked to a registered source", () => {
        expect(benchmarkedIds().sort()).toEqual([
            "cubemars-ak80-9",
            "dynamixel-xc430-w150-t",
            "dynamixel-xh540-w270-t",
            "dynamixel-xl430-w250-t",
            "dynamixel-xm430-w350-t",
            "dynamixel-xm540-w270-t",
            "feetech-sts3215",
            "feetech-sts3250",
            "mjbots-qdd100",
            "robstride-00",
            "robstride-01",
            "robstride-02",
            "robstride-03",
            "robstride-04",
            "steadywin-gim6010-8",
            "xiaomi-cybergear",
        ]);
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
            if (r.thermal) expect(r.uncertainty.thermal).toBeGreaterThan(0);
        }
        for (const r of BENCHMARK_RUNS.filter((x) => x.thermal?.length))
            expect(r.uncertainty.thermal, runKeyOf(r)).toBeGreaterThan(0);
    });

    test("deltas, leaderboard and continuous torque", () => {
        const deltas = datasheetDeltas(ACTUATORS);
        const ratios = deltas.map((d) => d.peak?.ratio ?? 0);
        expect(ratios).toEqual([...ratios].sort((a, b) => a - b));
        expect(deltas[0]?.actuator.id).toBe("dynamixel-xc430-w150-t");
        // Runs flagged notRanked or otherRevision get no datasheet delta.
        for (const id of ["steadywin-gim6010-8", "robstride-01"])
            expect(deltas.some((d) => d.actuator.id === id)).toBe(false);
        const gim = getRun("steadywin-gim6010-8", "hackaday-spider-bot-2025");
        const gimRow = ACTUATORS.find((a) => a.id === "steadywin-gim6010-8");
        if (!gim || !gimRow) throw new Error("GIM6010-8 fixture missing");
        expect(datasheetDelta(gim, gimRow).peak).toBeUndefined();
        // No-load speed is only ever a measured one, never the curve's end.
        for (const r of BENCHMARK_RUNS) expect(measuredNoLoad(r)).toBe(r.noLoadRpm);
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
