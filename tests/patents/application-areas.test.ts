import { describe, expect, test } from "bun:test";
import {
    APPLICATION_AREAS,
    APPLICATION_AREA_IDS,
    classifyAreas,
    getApplicationArea,
} from "@/patents";

describe("application areas", () => {
    test("every pattern compiles, is anchored and has a rationale", () => {
        for (const a of APPLICATION_AREAS) {
            expect(() => new RegExp(a.cpc), a.id).not.toThrow();
            expect(a.cpc.startsWith("^"), a.id).toBe(true);
            expect(a.why.length, a.id).toBeGreaterThan(20);
        }
    });

    test("areas do not duplicate ids, labels, patterns or CPC prefixes", () => {
        const uniq = (xs: string[]) => new Set(xs).size === xs.length;
        expect(uniq(APPLICATION_AREAS.map((a) => a.id))).toBe(true);
        expect(uniq(APPLICATION_AREAS.map((a) => a.label))).toBe(true);
        expect(uniq(APPLICATION_AREAS.map((a) => a.cpc))).toBe(true);
        // No CPC prefix listed in two areas.
        const prefixes = APPLICATION_AREAS.flatMap((a) =>
            a.cpc.replace(/^\^\(?|\)$/g, "").split("|"),
        );
        expect(uniq(prefixes)).toBe(true);
        expect(APPLICATION_AREA_IDS).toHaveLength(APPLICATION_AREAS.length);
    });

    test("classifies a family's codes, several areas or none", () => {
        expect(classifyAreas(["B60L50/00", "B25J9/102", "H02K7/1807"])).toEqual([
            "vehicles",
            "power",
        ]);
        // Legged vehicles are robots, not cars.
        expect(classifyAreas(["B62D57/032"])).toEqual(["robots"]);
        expect(classifyAreas(["B62D5/04"])).toEqual(["vehicles"]);
        expect(classifyAreas(["F16H49/001"])).toEqual([]);
        expect(getApplicationArea("medical")?.label).toBe("Medical & exoskeletons");
    });
});
