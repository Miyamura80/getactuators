import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
    BENCHMARK_RUNS,
    datasheetDeltas,
    measuredLeaderboard,
    thermalSeries,
} from "@/benchmarks";
import {
    type RunContext,
    validateBenchmarkDir,
    validateRun,
} from "@/benchmarks/validate";
import { ACTUATORS } from "@/catalog";

const catalog = new Map(ACTUATORS.map((a) => [a.id, a]));
const ctx = (over: Partial<RunContext> = {}): RunContext => ({
    folderActuator: "mjbots-qdd100",
    folderRun: "lab-run",
    files: ["tn.csv", "thermal.csv", "rig.md"],
    catalog,
    today: "2026-10-28",
    ...over,
});

// A complete community submission that passes every check.
const community = () => ({
    actuatorId: "mjbots-qdd100",
    runId: "lab-run",
    date: "2026-10-01",
    origin: "community",
    method: "raw",
    submitter: "octocat",
    unit: "qdd100 beta 3",
    rig: {
        torqueSensor: "Futek TRS605 10 Nm",
        accuracyPct: 0.2,
        encoder: "Renishaw 23-bit",
        ambientC: 22,
        busV: 24,
        controller: "moteus r4.11",
        firmware: "2024-05-01",
    },
    torqueSpeed: [
        { rpm: 0, torqueNm: 15.2 },
        { rpm: 50, torqueNm: 15 },
        { rpm: 100, torqueNm: 14.1, efficiency: 0.71 },
        { rpm: 200, torqueNm: 10.5, efficiency: 0.8 },
        { rpm: 380, torqueNm: 0 },
    ],
    thermal: [{ torqueNm: 6, tToLimitS: 390, windingRiseC: 70 }],
    uncertainty: {
        torqueNm: 0.05,
        rpm: 1,
        efficiency: 0.02,
        tToLimitS: 5,
        windingRiseC: 2,
    },
});

describe("validateRun", () => {
    test("accepts a complete community run", () => {
        expect(validateRun(community(), ctx())).toEqual([]);
    });

    test("rejects unknown fields and wrong units", () => {
        const run = { ...community(), peakTorque_kgcm: 30 };
        expect(validateRun(run, ctx()).join("\n")).toContain("peakTorque_kgcm");
        const eff = community();
        eff.torqueSpeed[2] = { rpm: 100, torqueNm: 14, efficiency: 1.2 };
        expect(validateRun(eff, ctx()).join("\n")).toContain("efficiency");
    });

    test("actuator must exist and match its folder", () => {
        const run = { ...community(), actuatorId: "made-up-motor" };
        const errors = validateRun(run, ctx({ folderActuator: "made-up-motor" }));
        expect(errors).toContain('actuator "made-up-motor" is not in the catalog');
        expect(validateRun(community(), ctx({ folderRun: "other" })).join()).toContain(
            "does not match folder",
        );
    });

    test("community runs need core measurements, rig, raw files and uncertainty", () => {
        const run = community() as Record<string, unknown>;
        run.thermal = undefined;
        run.torqueSpeed = [{ rpm: 10, torqueNm: 5 }];
        run.rig = { ...community().rig, accuracyPct: null };
        run.uncertainty = {};
        const text = validateRun(run, ctx({ files: [] })).join("\n");
        for (const want of [
            "at least 5 points",
            "stall point",
            "windingRiseC",
            "accuracyPct",
            "raw CSV",
            "rig.md",
            "uncertainty missing",
        ])
            expect(text).toContain(want);
        const noHandle = { ...community(), submitter: undefined };
        expect(validateRun(noHandle, ctx()).join()).toContain("GitHub handle");
    });

    test("published runs need a source", () => {
        const run = {
            ...community(),
            origin: "published",
            method: "reported",
            submitter: undefined,
        };
        expect(validateRun(run, ctx())).toContain(
            "published runs need a source { url, title }",
        );
    });

    test("plausibility: peak torque within 0.3x to 1.5x unless noted", () => {
        const run = community();
        run.torqueSpeed[0] = { rpm: 0, torqueNm: 40 };
        run.torqueSpeed[1] = { rpm: 50, torqueNm: 39 };
        expect(validateRun(run, ctx()).join()).toContain("2.50x the datasheet 16 Nm");
        expect(
            validateRun({ ...run, plausibilityNote: "Overdriven at 48 V" }, ctx()),
        ).toEqual([]);
    });

    test("torque-speed envelope must be monotonic and thermal holds ordered", () => {
        const run = community();
        run.torqueSpeed[3] = { rpm: 200, torqueNm: 16 };
        expect(validateRun(run, ctx()).join()).toContain("must not rise with speed");
        const hot = community();
        hot.thermal = [
            { torqueNm: 6, tToLimitS: 100, windingRiseC: 70 },
            { torqueNm: 8, tToLimitS: 500, windingRiseC: 70 },
        ];
        expect(validateRun(hot, ctx()).join()).toContain("cannot be held longer");
    });

    test("rejects future dates", () => {
        const run = { ...community(), date: "2027-01" };
        expect(validateRun(run, ctx()).join()).toContain("in the future");
    });
});

describe("data/benchmarks", () => {
    const root = join(import.meta.dir, "..", "..", "data", "benchmarks");

    test("every committed run is valid and bundled", () => {
        const { runs, errors } = validateBenchmarkDir(root);
        expect(errors).toEqual([]);
        expect(JSON.parse(JSON.stringify(runs))).toEqual(
            JSON.parse(JSON.stringify(BENCHMARK_RUNS)),
        );
    });

    test("every published run links to its source", () => {
        for (const run of BENCHMARK_RUNS.filter((r) => r.origin === "published"))
            expect(run.source?.url).toStartWith("https://");
        expect(new Set(BENCHMARK_RUNS.map((r) => r.actuatorId)).size).toBeGreaterThan(
            5,
        );
    });
});

describe("views", () => {
    test("datasheet vs measured flags over-promised backlash", () => {
        const sts = datasheetDeltas("feetech-sts3215");
        expect(sts.every((d) => d.metric === "backlashArcmin")).toBe(true);
        expect(sts.map((d) => d.verdict)).toEqual(["over-promised", "over-promised"]);
        const ak = datasheetDeltas("cubemars-ak80-9")[0];
        expect(ak?.verdict).toBe("beats");
        expect(ak?.claimed).toBe(11.4);
    });

    test("leaderboard ranks continuous holds only", () => {
        const board = measuredLeaderboard();
        expect(board.map((r) => r.actuator.id)).toEqual(["mjbots-qdd100"]);
        expect(board[0]?.densityNmPerKg).toBeCloseTo(3.3 / 0.507, 3);
    });

    test("thermal series are sorted by torque", () => {
        const cg = thermalSeries().find((s) => s.actuatorId === "xiaomi-cybergear");
        expect(cg?.points.map((p) => p.torqueNm)).toEqual([11, 10, 9, 7]);
    });
});
