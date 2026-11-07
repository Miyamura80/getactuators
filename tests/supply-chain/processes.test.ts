import { describe, expect, test } from "bun:test";
import { auditRegistry } from "@/supply-chain/audit";
import { COMPANIES } from "@/supply-chain/companies";
import { concentrationTier, tierOf } from "@/supply-chain/concentration-tier";
import { METAL_IDS } from "@/supply-chain/metals/elements";
import {
    MAGNET_CHAIN,
    MAGNET_STEP_IDS,
    MAX_CAPTION_WORDS,
    MAX_LABEL_WORDS,
    PROCESS_CHAINS,
    PROCESS_STEP_IDS,
    isProcessStepId,
    neighbours,
    processErrors,
    sharesOf,
    wordCount,
} from "@/supply-chain/processes";
import {
    type Box,
    CLUSTER_HEAD,
    PRODUCT_ID,
    chainLayout,
    detailFor,
    edgePath,
    fitTransform,
    labelBox,
} from "@/supply-chain/processes/layout";
import { UNOPENED, unopenedSourceErrors } from "@/supply-chain/processes/sources";
import { loopProblems, sceneProblems } from "@/supply-chain/scenes/check";
import { MAGNET_LOOPS } from "@/supply-chain/scenes/magnet-loops";
import { getSource } from "@/supply-chain/sources";

describe("magnet process chain", () => {
    test("has every step of the issue's graph, ore to rotor", () => {
        // Exactly these 20 steps: no extras, no duplicates.
        expect([...MAGNET_STEP_IDS].sort()).toEqual(
            [
                "open-pit-mining",
                "ionic-clay-leaching",
                "beneficiation",
                "cracking",
                "solvent-extraction",
                "heavy-separation",
                "precipitation",
                "electrolysis",
                "calciothermic-reduction",
                "strip-casting",
                "hydrogen-decrepitation",
                "jet-milling",
                "field-pressing",
                "sintering",
                "grain-boundary-diffusion",
                "machining",
                "coating",
                "magnetising",
                "inspection",
                "scrap-recycling",
            ].sort(),
        );
        expect(MAGNET_CHAIN.clusters.map((c) => c.id)).toEqual([
            "mining",
            "separation",
            "metal-alloy",
            "magnet",
        ]);
        expect(processErrors()).toEqual([]);
    });

    test("very little text: labels at most four words, captions at most twelve", () => {
        for (const c of PROCESS_CHAINS)
            for (const s of c.steps) {
                expect(wordCount(s.label)).toBeLessThanOrEqual(MAX_LABEL_WORDS);
                expect(wordCount(s.caption)).toBeLessThanOrEqual(MAX_CAPTION_WORDS);
            }
        expect(
            processErrors([
                {
                    ...MAGNET_CHAIN,
                    steps: [
                        {
                            ...MAGNET_CHAIN.steps[0],
                            label: "one two three four five",
                        } as never,
                    ],
                },
            ]),
        ).toContain(
            'process magnet/open-pit-mining: label "one two three four five" is over 4 words',
        );
    });

    test("the audit flags a company id missing from the registry", () => {
        const step = MAGNET_CHAIN.steps[0];
        if (!step) throw new Error("no steps");
        const bad = {
            ...MAGNET_CHAIN,
            steps: [{ ...step, companyIds: ["no-such-company"] }],
            edges: [],
        };
        expect(processErrors([bad])).toEqual([
            `process magnet/${step.id}: unknown company "no-such-company"`,
        ]);
    });

    test("documents never opened carry no accessed date", () => {
        expect([...UNOPENED].sort()).toEqual(
            [
                "uspto-us11270840-magnet",
                "uspto-us11569012-hd",
                "cnipa-cn1702785a-pressing",
                "radialmagnet-n35sh-block",
            ].sort(),
        );
        for (const id of UNOPENED) {
            expect(getSource(id)).toBeDefined();
            expect(getSource(id)?.accessed).toBeUndefined();
        }
        expect(unopenedSourceErrors()).toEqual([]);
        expect(unopenedSourceErrors([])).toHaveLength(UNOPENED.size);
        expect(getSource("tuda-loewe-gbd-2016")?.accessed).toBe("2026-11-03");
    });

    test("step ids are the /bom contract: unique, and the kit's chips resolve", () => {
        expect(PROCESS_STEP_IDS.size).toBe(
            PROCESS_CHAINS.flatMap((c) => c.steps).length,
        );
        // ProcessStepChip ids used on the kit page and in tests.
        for (const id of ["sintering", "strip-casting", "jet-milling"])
            expect(isProcessStepId(id)).toBe(true);
        expect(isProcessStepId("winding")).toBe(false);
    });

    test("branches and the scrap loop are wired", () => {
        // Main-line neighbours first, so Next stays on the main line.
        expect(neighbours(MAGNET_CHAIN, "solvent-extraction").next).toEqual([
            "precipitation",
            "heavy-separation",
        ]);
        expect(neighbours(MAGNET_CHAIN, "sintering").next[0]).toBe("machining");
        expect(neighbours(MAGNET_CHAIN, "machining").next[0]).toBe("coating");
        expect(neighbours(MAGNET_CHAIN, "grain-boundary-diffusion").prev).toEqual([
            "calciothermic-reduction",
            "sintering",
        ]);
        const loops = MAGNET_CHAIN.edges.filter((e) => e.kind === "loop");
        expect(loops.map((e) => `${e.from}->${e.to}`)).toEqual([
            "machining->scrap-recycling",
            "scrap-recycling->hydrogen-decrepitation",
            "scrap-recycling->solvent-extraction",
        ]);
    });

    test("every number is cited and every reference resolves", () => {
        const companies = new Set(COMPANIES.map((c) => c.id));
        for (const s of MAGNET_CHAIN.steps) {
            expect(s.companyIds.filter((id) => !companies.has(id))).toEqual([]);
            expect(s.elementIds.filter((e) => !METAL_IDS.includes(e))).toEqual([]);
            const cited = [
                ...s.sources,
                ...s.keyNumbers.flatMap((k) => k.value.sources),
            ];
            expect(cited.filter((id) => !getSource(id))).toEqual([]);
            expect(s.keyNumbers.every((k) => k.value.sources.length > 0)).toBe(true);
            expect(s.keyNumbers.every((k) => wordCount(k.label) <= 3)).toBe(true);
            expect(!s.shares || Boolean(sharesOf(s.shares))).toBe(true);
        }
        // Steps with numbers: all but inspection.
        expect(
            MAGNET_CHAIN.steps
                .filter((s) => s.keyNumbers.length === 0)
                .map((s) => s.id),
        ).toEqual(["inspection"]);
        expect(auditRegistry("2026-11-03").errors).toEqual([]);
    });

    test("at least twelve animated vignettes, each valid", () => {
        const animated = MAGNET_CHAIN.steps.filter((s) => s.animation);
        expect(animated.length).toBeGreaterThanOrEqual(12);
        for (const l of MAGNET_LOOPS) expect(loopProblems(l)).toEqual([]);
        expect(new Set(animated.map((s) => s.animation?.id)).size).toBe(
            animated.length,
        );
        expect(
            MAGNET_CHAIN.productScene && sceneProblems(MAGNET_CHAIN.productScene),
        ).toEqual([]);
    });
});

const overlaps = (a: Box, b: Box): boolean =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function overlappingPairs(boxes: Box[]): number {
    return boxes.reduce(
        (n, a, i) => n + boxes.slice(i + 1).filter((b) => overlaps(a, b)).length,
        0,
    );
}

describe("process map layout", () => {
    const layout = chainLayout(MAGNET_CHAIN);

    test("no two step cards overlap and clusters do not overlap", () => {
        expect(overlappingPairs([...layout.nodes.values()])).toBe(0);
        expect(overlappingPairs(layout.clusters)).toBe(0);
        // The recycling node floats outside every cluster frame.
        const r = layout.nodes.get("scrap-recycling") as Box;
        expect(layout.clusters.filter((c) => overlaps(r, c))).toEqual([]);
        expect(CLUSTER_HEAD).toBeGreaterThan(0);
    });

    test("edges: one per chain edge plus the product, ports on facing sides", () => {
        expect(layout.edges).toHaveLength(MAGNET_CHAIN.edges.length + 1);
        expect(layout.edges.at(-1)).toMatchObject({
            from: "inspection",
            to: PRODUCT_ID,
        });
        const d = edgePath(
            { x: 0, y: 0, w: 100, h: 50 },
            { x: 200, y: 0, w: 100, h: 50 },
        ).d;
        expect(d).toBe("M100,25C150,25 150,25 200,25");
        const v = edgePath(
            { x: 0, y: 0, w: 100, h: 50 },
            { x: 0, y: 200, w: 100, h: 50 },
        ).d;
        expect(v.startsWith("M50,50")).toBe(true);
    });

    test("edge labels sit clear of every step card, cluster head and each other", () => {
        for (const chain of PROCESS_CHAINS) {
            const l = chainLayout(chain);
            const heads = l.clusters.map((c) => ({
                x: c.x,
                y: c.y,
                w: c.w,
                h: CLUSTER_HEAD,
            }));
            const labelled = l.edges.filter((e) => e.label);
            expect(labelled.length).toBe(chain.edges.filter((e) => e.label).length);
            for (const e of labelled) {
                const box = labelBox(e.label as NonNullable<typeof e.label>);
                const hits = [...l.nodes.entries()]
                    .filter(([, n]) => overlaps(box, n))
                    .map(([id]) => id);
                expect({ edge: `${e.from}->${e.to}`, hits }).toEqual({
                    edge: `${e.from}->${e.to}`,
                    hits: [],
                });
                expect(heads.filter((h) => overlaps(box, h))).toEqual([]);
                // Labels show for one step's edges at a time.
                const clash = labelled.filter(
                    (f) =>
                        f !== e &&
                        [f.from, f.to].some((id) => id === e.from || id === e.to) &&
                        overlaps(box, labelBox(f.label as NonNullable<typeof f.label>)),
                );
                expect(clash).toEqual([]);
            }
        }
    });

    test("zoom: clusters at the fitted overview, steps once zoomed in", () => {
        const fit = fitTransform(
            1100,
            600,
            { x: 0, y: 0, w: layout.width, h: layout.height },
            16,
        );
        expect(detailFor(fit.k, fit.k)).toBe("clusters");
        expect(detailFor(fit.k * 1.5, fit.k)).toBe("steps");
        expect(detailFor(0.3)).toBe("clusters");
        expect(detailFor(1)).toBe("steps");
    });
});

describe("concentration tiers", () => {
    test("monopolized at 80%, concentrated at 50%", () => {
        expect(tierOf(0.94)).toBe("monopolized");
        expect(tierOf(0.69)).toBe("concentrated");
        expect(tierOf(0.4)).toBe("distributed");
        expect(concentrationTier({ CN: 0.91, other: 0.09 })?.tier).toBe("monopolized");
        expect(concentrationTier({})).toBeNull();
    });
});
