import { describe, expect, test } from "bun:test";
import { auditRegistry } from "@/supply-chain/audit";
import { METAL_EVENTS } from "@/supply-chain/metals";
import {
    MEASURE_TYPES,
    POLICY_AS_OF,
    POLICY_LANES,
    POLICY_MEASURES,
    type PolicyMeasure,
    countBy,
    findMeasures,
    laneOf,
    measureErrors,
    measuresForCountry,
    policyChanges,
    policyErrors,
} from "@/supply-chain/policy";
import { placeLane, segments, yearOf } from "@/supply-chain/policy/timeline";

const base = POLICY_MEASURES.find((m) => m.id === "cn-mofcom-2025-57") as PolicyMeasure;

describe("policy dataset", () => {
    test("60+ measures across all four types and every lane", () => {
        expect(POLICY_MEASURES.length).toBeGreaterThanOrEqual(60);
        const types = countBy(MEASURE_TYPES, (m) => m.type);
        for (const t of MEASURE_TYPES) expect(types[t]).toBeGreaterThanOrEqual(5);
        const lanes = countBy(POLICY_LANES, laneOf);
        for (const l of POLICY_LANES) expect(lanes[l]).toBeGreaterThan(0);
        expect(POLICY_MEASURES.some((m) => m.statusHistory[0]!.date < "2012")).toBe(
            true,
        );
    });

    test("every measure passes the integrity rules and the citation audit", () => {
        expect(policyErrors(POLICY_AS_OF)).toEqual([]);
        expect(auditRegistry(POLICY_AS_OF).errors).toEqual([]);
    });

    test("a measure without a primary source fails", () => {
        const m = { ...base, sources: ["af-china-tech-ban-2023"] };
        expect(measureErrors(m, POLICY_AS_OF)).toContain(
            "policy cn-mofcom-2025-57: no primary (government or standards body) source",
        );
    });

    test("an out-of-order statusHistory fails", () => {
        const m = { ...base, statusHistory: [...base.statusHistory].reverse() };
        expect(
            measureErrors(m, POLICY_AS_OF).some((e) => e.includes("out of order")),
        ).toBe(true);
    });

    test("status must match the latest change; summaries stay under 60 words", () => {
        expect(measureErrors({ ...base, status: "in-force" }, POLICY_AS_OF)).toContain(
            "policy cn-mofcom-2025-57: status in-force differs from the latest change",
        );
        const long = Array.from({ length: 61 }, () => "word").join(" ");
        expect(measureErrors({ ...base, summary: long }, POLICY_AS_OF)).toContain(
            "policy cn-mofcom-2025-57: summary is 61 words",
        );
        const future = {
            ...base,
            statusHistory: [
                ...base.statusHistory,
                {
                    date: "2030-01",
                    status: "suspended" as const,
                    sources: ["mofcom-2025-70"],
                },
            ],
        };
        expect(
            measureErrors(future, POLICY_AS_OF).some((e) =>
                e.includes("in the future"),
            ),
        ).toBe(true);
    });

    test("filters and country strips", () => {
        expect(
            findMeasures({ jurisdiction: "us", type: "subsidy" }).every(
                (m) => m.jurisdiction === "US",
            ),
        ).toBe(true);
        const jp = measuresForCountry("JP");
        expect(jp.length).toBeGreaterThan(5);
        expect(jp.every((m) => m.jurisdiction === "JP")).toBe(true);
        const changes = policyChanges();
        expect(changes[0]!.date >= changes.at(-1)!.date).toBe(true);
    });
});

describe("/metals reads its policy pins from the dataset", () => {
    test("policy events come from measures, with stable ids", () => {
        const linked = METAL_EVENTS.filter((e) => e.measureId);
        expect(linked.map((e) => e.id).sort()).toEqual([
            "controls-2025-10",
            "dod-floor-2025",
            "licensing-2025-04",
            "quotas-end-2015",
            "tech-ban-2023",
        ]);
        for (const e of linked) {
            const m = POLICY_MEASURES.find((x) => x.id === e.measureId)!;
            expect(e.detail).toBe(m.summary);
            expect(e.sources).toEqual(m.sources);
        }
        const dates = METAL_EVENTS.map((e) => e.date);
        expect(dates).toEqual([...dates].sort());
        expect(new Set(METAL_EVENTS.map((e) => e.id)).size).toBe(METAL_EVENTS.length);
    });
});

describe("swimlane geometry", () => {
    test("segments follow the status history and stop at expiry", () => {
        const s = segments(base, POLICY_AS_OF);
        expect(s.map((x) => x.status)).toEqual(["announced", "suspended"]);
        expect(s[1]!.to).toBeCloseTo(yearOf(POLICY_AS_OF));
        const expired = POLICY_MEASURES.find((m) => m.id === "us-section-122-2026")!;
        expect(segments(expired, POLICY_AS_OF).at(-1)!.to).toBeCloseTo(
            yearOf("2026-07-24"),
        );
    });

    test("markers in one lane never share a track within the gap", () => {
        for (const lane of POLICY_LANES) {
            const { placed, tracks } = placeLane(
                POLICY_MEASURES.filter((m) => laneOf(m) === lane),
                POLICY_AS_OF,
            );
            expect(tracks).toBeLessThanOrEqual(6);
            for (const a of placed)
                for (const b of placed)
                    if (a !== b && a.track === b.track)
                        expect(Math.abs(a.start - b.start)).toBeGreaterThanOrEqual(
                            0.3 - 1e-9,
                        );
        }
    });
});
