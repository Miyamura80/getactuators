import { describe, expect, test } from "bun:test";
import { auditRegistry } from "@/supply-chain/audit";
import { COMPANIES } from "@/supply-chain/companies";
import {
    PRECISION_CHAIN,
    PRECISION_PART_STEPS,
    PRECISION_STEP_IDS,
    PROCESS_CHAINS,
    isProcessStepId,
    neighbours,
    processErrors,
    sharesOf,
    wordCount,
} from "@/supply-chain/processes";
import {
    type Box,
    PRODUCT_ID,
    busPath,
    chainLayout,
    edgePath,
} from "@/supply-chain/processes/layout";
import {
    PRECISION_SOURCES,
    PRECISION_UNOPENED,
} from "@/supply-chain/processes/precision-sources";
import { CHAIN_STEP_INDEX, otherChainOf } from "@/supply-chain/processes/step-index";
import { loopProblems, sceneProblems } from "@/supply-chain/scenes/check";
import {
    PRECISION_JOINT,
    PRECISION_LOOPS,
} from "@/supply-chain/scenes/precision-loops";
import { getSource } from "@/supply-chain/sources";

const overlaps = (a: Box, b: Box): boolean =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const overlappingPairs = (boxes: Box[]): number =>
    boxes.reduce(
        (n, a, i) => n + boxes.slice(i + 1).filter((b) => overlaps(a, b)).length,
        0,
    );

const byCluster = (id: string) =>
    PRECISION_CHAIN.steps.filter((s) => s.cluster === id).map((s) => s.id);

describe("precision process chain", () => {
    test("four sub-chains with the issue's steps, branches and inspections", () => {
        expect(PRECISION_CHAIN.clusters.map((c) => [c.id, c.stage])).toEqual([
            ["strain-wave", "gearing"],
            ["roller-screw", "screw"],
            ["bearing", "bearing"],
            ["encoder", "electronics"],
        ]);
        expect(byCluster("strain-wave")).toEqual([
            "flexspline-forging",
            "flexspline-forming",
            "flexspline-hardening",
            "flexspline-hobbing",
            "flexspline-shot-peening",
            "circular-spline-cutting",
            "wave-generator-grinding",
            "strain-wave-assembly",
            "strain-wave-testing",
        ]);
        expect(byCluster("roller-screw")).toEqual([
            "roller-screw-turning",
            "screw-hardening",
            "screw-thread-grinding",
            "roller-thread-grinding",
            "nut-thread-grinding",
            "roller-screw-assembly",
            "lead-accuracy-test",
        ]);
        expect(byCluster("bearing")).toEqual([
            "bearing-steel-refining",
            "ring-forging",
            "ring-hardening",
            "raceway-grinding",
            "raceway-superfinishing",
            "rolling-element-sorting",
            "bearing-assembly",
            "bearing-noise-test",
        ]);
        expect(byCluster("encoder")).toEqual([
            "scale-substrate",
            "grating-lithography",
            "magnetic-pole-writing",
            "readhead-assembly",
            "interpolation-asic",
            "encoder-calibration",
            "encoder-sealing",
        ]);
        expect([...PRECISION_STEP_IDS]).toEqual(PRECISION_CHAIN.steps.map((s) => s.id));
        expect(PRECISION_CHAIN.parallel).toBe(true);
        // Shot peening is optional; the magnetic scale is the other route.
        expect(
            PRECISION_CHAIN.steps.filter((s) => s.branch).map((s) => [s.id, s.branch]),
        ).toEqual([
            ["flexspline-shot-peening", "optional"],
            ["magnetic-pole-writing", "alternative"],
        ]);
        expect(processErrors()).toEqual([]);
    });

    test("branches fan out and merge; each sub-chain ends in a check", () => {
        expect(neighbours(PRECISION_CHAIN, "screw-hardening").next).toEqual([
            "screw-thread-grinding",
            "roller-thread-grinding",
            "nut-thread-grinding",
        ]);
        // Next stays on the main line past the optional peening.
        expect(neighbours(PRECISION_CHAIN, "flexspline-hobbing").next).toEqual([
            "strain-wave-assembly",
            "flexspline-shot-peening",
        ]);
        expect(neighbours(PRECISION_CHAIN, "strain-wave-assembly").prev).toEqual([
            "flexspline-hobbing",
            "circular-spline-cutting",
            "wave-generator-grinding",
            "flexspline-shot-peening",
        ]);
        // The /bom contract: the last step of each finished part.
        for (const id of Object.values(PRECISION_PART_STEPS)) {
            expect(isProcessStepId(id)).toBe(true);
            expect(neighbours(PRECISION_CHAIN, id).next).toEqual([]);
        }
    });

    test("every number is cited, every reference resolves, shares carry a method", () => {
        const companies = new Set(COMPANIES.map((c) => c.id));
        for (const s of PRECISION_CHAIN.steps) {
            expect(s.companyIds.filter((id) => !companies.has(id))).toEqual([]);
            const cited = [
                ...s.sources,
                ...s.keyNumbers.flatMap((k) => k.value.sources),
            ];
            expect(cited.filter((id) => !getSource(id))).toEqual([]);
            // Every number names at least one source of its own.
            expect(
                s.keyNumbers
                    .filter((k) => k.value.sources.length === 0)
                    .map((k) => k.label),
            ).toEqual([]);
            expect(s.keyNumbers.length).toBeLessThanOrEqual(3);
            expect(s.keyNumbers.every((k) => wordCount(k.label) <= 3)).toBe(true);
            // Labels key the card's list, so they are unique per step.
            expect(new Set(s.keyNumbers.map((k) => k.label)).size).toBe(
                s.keyNumbers.length,
            );
            expect(Boolean(sharesOf(s.shares))).toBe(true);
        }
        expect(
            PRECISION_CHAIN.steps
                .filter((s) => s.keyNumbers.length === 0)
                .map((s) => s.id),
        ).toEqual(["flexspline-forging", "scale-substrate"]);
        for (const c of PRECISION_CHAIN.clusters) {
            const s = sharesOf(c.shares);
            expect(s?.confidence === "reported").toBe(false);
            expect((s?.note ?? "").length).toBeGreaterThan(20);
        }
        expect(auditRegistry("2026-11-07").errors).toEqual([]);
    });

    test("unopened documents are exactly those without an accessed date", () => {
        for (const s of PRECISION_SOURCES) {
            const accessed = getSource(s.id)?.accessed;
            expect({ id: s.id, unopened: PRECISION_UNOPENED.has(s.id) }).toEqual({
                id: s.id,
                unopened: accessed === undefined,
            });
        }
        // Opening a document and dating it takes it off the list.
        expect(PRECISION_UNOPENED.size).toBeLessThanOrEqual(PRECISION_SOURCES.length);
    });

    test("at least four animated vignettes per sub-chain, each valid", () => {
        for (const c of PRECISION_CHAIN.clusters) {
            const animated = PRECISION_CHAIN.steps.filter(
                (s) => s.cluster === c.id && s.animation,
            );
            expect(animated.length).toBeGreaterThanOrEqual(4);
        }
        const loops = PRECISION_CHAIN.steps.flatMap((s) =>
            s.animation ? [s.animation] : [],
        );
        expect(loops.length).toBeGreaterThanOrEqual(16);
        expect(new Set(loops.map((l) => l.id)).size).toBe(loops.length);
        expect(loops.map((l) => l.id).sort()).toEqual(
            PRECISION_LOOPS.map((l) => l.id).sort(),
        );
        for (const l of PRECISION_LOOPS) expect(loopProblems(l)).toEqual([]);
        expect(sceneProblems(PRECISION_JOINT)).toEqual([]);
    });

    test("layout: lanes do not overlap, the product sits outside and every lane feeds it", () => {
        const layout = chainLayout(PRECISION_CHAIN);
        expect(overlappingPairs([...layout.nodes.values()])).toBe(0);
        expect(overlappingPairs(layout.clusters)).toBe(0);
        const product = layout.nodes.get(PRODUCT_ID) as Box;
        expect(layout.clusters.filter((c) => overlaps(product, c))).toEqual([]);
        const feeds = layout.edges.filter((e) => e.to === PRODUCT_ID);
        expect(feeds.map((e) => e.from).sort()).toEqual(
            Object.values(PRECISION_PART_STEPS).sort(),
        );
        // One shared trunk: every feed turns at the same x.
        expect(new Set(feeds.map((e) => e.mid[0])).size).toBe(1);
        const a = { x: 0, y: 0, w: 10, h: 10 };
        const b = { x: 100, y: 0, w: 10, h: 10 };
        expect(busPath(a, b, 50).d).toBe(edgePath(a, b).d);
        expect(busPath(a, { ...b, y: 80 }, 50).d).toContain("V");
    });
});

test("the light step index matches every chain but the first", () => {
    expect(Object.keys(CHAIN_STEP_INDEX)).toEqual(
        PROCESS_CHAINS.slice(1).map((c) => c.id),
    );
    for (const c of PROCESS_CHAINS.slice(1))
        expect(CHAIN_STEP_INDEX[c.id]).toEqual(c.steps.map((s) => s.id));
    expect(otherChainOf("roller-thread-grinding")).toBe("precision");
    expect(otherChainOf("jet-milling")).toBeNull();
});
