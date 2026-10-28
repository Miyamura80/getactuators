import { describe, expect, test } from "bun:test";
import { TOP_FAMILIES } from "../../scripts/patents/aggregate";
import { buildLandscapeSql } from "../../scripts/patents/sql";
import {
    ASSIGNEE_ALIASES,
    cleanAssignee,
    normalizeAssignee,
    unknownCompanyLinks,
} from "../../src/patents/assignees";
import {
    LANDSCAPE,
    assigneeMap,
    cagr3,
    firstIncompleteYear,
    isCollected,
    leaderboard,
    searchFamilies,
    streamByCountry,
    streamByTechnology,
    technologySnapshot,
    years,
} from "../../src/patents/landscape";
import {
    TECHNOLOGIES,
    type Technology,
    codesOverlap,
    cpcMatches,
    unintendedOverlaps,
} from "../../src/patents/technologies";
import { FIXTURE } from "./fixture";

const CPC_SYMBOL = /^[A-HY]\d{2}[A-Z]\d{1,4}\/\d{2,6}$/;

describe("CPC code sets", () => {
    test("every technology has codes with a title and rationale", () => {
        expect(new Set(TECHNOLOGIES.map((t) => t.id)).size).toBe(TECHNOLOGIES.length);
        for (const t of TECHNOLOGIES) {
            expect(t.cpc.length).toBeGreaterThan(0);
            for (const c of t.cpc) {
                expect(c.code).toMatch(CPC_SYMBOL);
                expect(c.title.length).toBeGreaterThan(0);
                expect(c.rationale.length).toBeGreaterThan(0);
                if (c.keywords) expect(c.keywords.length).toBeGreaterThan(0);
            }
        }
    });

    test("code sets do not overlap across technologies unless allowed", () => {
        expect(unintendedOverlaps()).toEqual([]);
        const twin = [
            ...TECHNOLOGIES,
            { ...(TECHNOLOGIES[1] as Technology), id: "twin" },
        ];
        expect(unintendedOverlaps(twin)).toEqual([
            "strain-wave F16H49/001 / twin F16H49/001",
        ]);
    });

    test("prefix and exact matching", () => {
        const prefix = {
            code: "F16H1/28",
            match: "prefix",
            title: "x",
            rationale: "x",
        } as const;
        const exact = {
            code: "H01F1/047",
            match: "exact",
            title: "x",
            rationale: "x",
        } as const;
        expect(cpcMatches(prefix, "F16H1/2809")).toBe(true);
        expect(cpcMatches(prefix, "F16H1/32")).toBe(false);
        expect(cpcMatches(exact, "H01F1/047")).toBe(true);
        expect(cpcMatches(exact, "H01F1/0477")).toBe(false);
        expect(codesOverlap(prefix, { ...prefix, code: "F16H1/2809" })).toBe(true);
        expect(codesOverlap(exact, { ...prefix, code: "H01F1/057" })).toBe(false);
        expect(codesOverlap(exact, { ...prefix, code: "H01F1/04" })).toBe(true);
    });

    test("the committed query is generated from the code sets", async () => {
        const committed = await Bun.file(
            `${import.meta.dir}/../../scripts/patents/queries/landscape.sql`,
        ).text();
        expect(committed).toBe(buildLandscapeSql());
        for (const t of TECHNOLOGIES) {
            expect(committed).toContain(`'${t.id}'`);
            for (const c of t.cpc) expect(committed).toContain(c.code);
        }
        expect(committed).toContain("GROUP BY family_id");
    });
});

describe("assignee normalisation", () => {
    test("strips legal forms and folds subsidiaries", () => {
        expect(cleanAssignee("Harmonic Drive Systems Inc.")).toBe(
            "HARMONIC DRIVE SYSTEMS",
        );
        expect(cleanAssignee("SHIN-ETSU CHEMICAL CO LTD")).toBe("SHIN ETSU CHEMICAL");
        expect(normalizeAssignee("HARMONIC DRIVE LLC")).toEqual({
            key: "harmonic-drive-systems",
            name: "Harmonic Drive Systems",
            companyId: "harmonic-drive-systems",
        });
        expect(normalizeAssignee("NIDEC SHIMPO CORP").companyId).toBe("nidec");
        expect(normalizeAssignee("Acme Gears GmbH")).toEqual({
            key: "acme-gears",
            name: "ACME GEARS",
        });
    });

    test("every registry link points at a real company", () => {
        expect(unknownCompanyLinks()).toEqual([]);
        expect(new Set(ASSIGNEE_ALIASES.map((a) => a.id)).size).toBe(
            ASSIGNEE_ALIASES.length,
        );
    });
});

describe("committed snapshot", () => {
    test("is aggregates only and never invents counts", () => {
        if (!isCollected(LANDSCAPE)) {
            expect(LANDSCAPE.collectedAt).toBeNull();
            expect(LANDSCAPE.technologies).toEqual([]);
            expect(LANDSCAPE.crossChecks).toEqual([]);
            return;
        }
        const ids = new Set(TECHNOLOGIES.map((t) => t.id));
        for (const t of LANDSCAPE.technologies) {
            expect(ids.has(t.id)).toBe(true);
            expect(t.topFamilies.length).toBeLessThanOrEqual(TOP_FAMILIES);
            const sum = t.byYearCountry.reduce((s, r) => s + r.families, 0);
            expect(sum).toBe(t.families);
        }
    });
});

describe("aggregation and views (synthetic fixture)", () => {
    test("deduplicates families and splits technologies", () => {
        expect(technologySnapshot("strain-wave", FIXTURE)?.families).toBe(40);
        expect(technologySnapshot("robot-joints", FIXTURE)?.families).toBe(5);
        expect(technologySnapshot("cycloidal", FIXTURE)?.families).toBe(0);
        expect(firstIncompleteYear(FIXTURE)).toBe(2025);
        expect(years(FIXTURE)).toHaveLength(17);
    });

    test("leaderboard merges aliases, with share, CAGR and top-5 share", () => {
        const board = leaderboard("strain-wave", FIXTURE);
        expect(board?.rows.map((r) => [r.key, r.families])).toEqual([
            ["harmonic-drive-systems", 30],
            ["acme-gears", 5],
            ["leaderdrive", 5],
        ]);
        expect(board?.rows[0]?.share).toBe(0.75);
        expect(board?.rows[0]?.cagr).toBe(-1);
        expect(board?.rows[1]?.cagr).toBeNull();
        expect(board?.top5Share).toBe(1);
        expect(board?.window).toEqual([2021, 2024]);
        expect(
            cagr3(
                [
                    { year: 2021, families: 8 },
                    { year: 2024, families: 27 },
                ],
                FIXTURE,
            ),
        ).toBeCloseTo(0.5);
    });

    test("stream, map and search", () => {
        const byCountry = streamByCountry(["strain-wave"], FIXTURE);
        expect(byCountry.map((s) => s.key)).toEqual(["US", "JP", "CN", "DE"]);
        expect(byCountry[0]?.values[2021 - 2010]).toBe(20);
        expect(streamByTechnology(FIXTURE).map((s) => s.key)).toEqual([
            "robot-joints",
            "strain-wave",
            "ndfeb",
        ]);
        const map = assigneeMap(["strain-wave"], FIXTURE);
        expect(map[0]).toMatchObject({
            key: "harmonic-drive-systems",
            precision: "city",
        });
        expect(map.find((p) => p.key === "acme-gears")?.precision).toBe("country");
        const families = technologySnapshot("strain-wave", FIXTURE)?.topFamilies ?? [];
        expect(families[0]?.priorityDate.startsWith("2025")).toBe(true);
        expect(searchFamilies(families, "acme")).toHaveLength(5);
    });
});
