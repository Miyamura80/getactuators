import { describe, expect, test } from "bun:test";
import {
    BOM_CASES,
    bomErrors,
    caseScene,
    caseWithNode,
    partFor,
} from "@/supply-chain/bom";
import {
    CONVERSION_ID,
    PROFIT_ID,
    type PriceFn,
    SALE_ID,
    costStack,
    flatten,
    idiotIndex,
    marginCapture,
    massOf,
    materialNodeId,
    nodeMetrics,
    rawContentCost,
    stepMultiplier,
    toSankey,
} from "@/supply-chain/bom/metrics";
import { bomSlugOf } from "@/supply-chain/bom/path";
import type { BomCase, BomNode } from "@/supply-chain/bom/types";
import { usesOf } from "@/supply-chain/bom/used-in";
import { isProcessStepId } from "@/supply-chain/processes";
import type { Sourced } from "@/supply-chain/sourced";

const usd = (value: number): Sourced<number> => ({
    value,
    unit: "USD",
    sources: ["x"],
    asOf: "2026",
    confidence: "reported",
});
const grams = (value: number): Sourced<number> => ({
    value,
    unit: "g",
    sources: ["x"],
    asOf: "2026",
    confidence: "modeled",
});
const leaf = (id: string, seriesId: string, g: number, qty?: number): BomNode => ({
    id,
    label: id,
    kind: "material",
    material: { seriesId, massG: grams(g) },
    sources: ["x"],
    ...(qty ? { qty } : {}),
});

// Hand-checked fixture: steel $2/kg, copper $10/kg.
//   gear: 2 x (100 g steel) = $0.40 raw, sells for $8
//   coil: 50 g copper = $0.50 raw, no public cost
//   motor: gear + coil, sells for $20; raw $0.90
const PRICES: PriceFn = (id) =>
    ({ steel: 2, copper: 10 })[id as "steel" | "copper"] ?? null;
const gear: BomNode = {
    id: "gear",
    label: "Gear",
    kind: "component",
    unitCost: usd(8),
    children: [leaf("gear-steel", "steel", 100, 2)],
    sources: ["x"],
};
const coil: BomNode = {
    id: "coil",
    label: "Coil",
    kind: "component",
    children: [leaf("coil-copper", "copper", 50)],
    sources: ["x"],
    makerIds: ["acme"],
    makerConfidence: "reported",
};
const motor: BomNode = {
    id: "motor",
    label: "Motor",
    kind: "assembly",
    unitCost: usd(20),
    makerIds: ["motorco"],
    makerConfidence: "reported",
    children: [{ ...gear, makerIds: ["gearco"], makerConfidence: "modeled" }, coil],
    sources: ["x"],
};
const CASE: BomCase = {
    slug: "unitree-qdd",
    name: "Fixture",
    short: "Fixture",
    subject: "Fixture",
    price: usd(20),
    volumeAssumption: "",
    month: "2026-09",
    why: "",
    takeaway: "",
    uses: {},
    root: motor,
};

describe("BOM metrics (hand-checked fixture)", () => {
    test("raw content sums leaves times quantity", () => {
        expect(rawContentCost(gear, "2026-09", PRICES)).toBeCloseTo(0.4, 10);
        expect(rawContentCost(motor, "2026-09", PRICES)).toBeCloseTo(0.9, 10);
    });

    test("idiot index is unit cost over raw content, cumulative", () => {
        expect(idiotIndex(gear, "2026-09", PRICES)).toBeCloseTo(20, 10);
        expect(idiotIndex(motor, "2026-09", PRICES)).toBeCloseTo(20 / 0.9, 10);
        expect(idiotIndex(coil, "2026-09", PRICES)).toBeNull();
    });

    test("step multiplier needs every input priced", () => {
        expect(stepMultiplier(gear, "2026-09", PRICES)).toBeCloseTo(8 / 0.4, 10);
        expect(stepMultiplier(motor, "2026-09", PRICES)).toBeNull();
        const priced = { ...motor, children: [gear, { ...coil, unitCost: usd(2) }] };
        expect(stepMultiplier(priced, "2026-09", PRICES)).toBeCloseTo(2, 10);
    });

    test("margin capture: revenue x gross margin over price, in-house parts once", () => {
        const margins: Record<string, number> = {
            motorco: 0.25,
            gearco: 0.4,
            acme: 0.5,
        };
        const mc = marginCapture(CASE, PRICES, (id) => margins[id]);
        const by = Object.fromEntries(mc.tiers.map((t) => [t.companyId, t]));
        expect(by.motorco?.grossProfit).toBeCloseTo(5, 10);
        expect(by.motorco?.share).toBeCloseTo(0.25, 10);
        expect(by.gearco?.grossProfit).toBeCloseTo(3.2, 10);
        expect(by.gearco?.representative).toBe(true);
        // The coil has no public cost, so its maker earns no tier.
        expect(by.acme).toBeUndefined();
        expect(mc.raw).toBeCloseTo(0.9, 10);
        expect(mc.other).toBeCloseTo(20 - 5 - 3.2 - 0.9, 10);
        const inHouse = marginCapture(
            {
                ...CASE,
                root: {
                    ...motor,
                    children: [
                        { ...gear, makerIds: ["motorco"], makerConfidence: "reported" },
                        coil,
                    ],
                },
            },
            PRICES,
            (id) => margins[id],
        );
        expect(inHouse.tiers.map((t) => t.companyId)).toEqual(["motorco"]);
    });

    test("Sankey links carry cost (or raw cost when unpriced) per actuator", () => {
        const s = toSankey(CASE, "cost", PRICES);
        const link = (a: string, b: string) =>
            s.links.find((l) => l.source === a && l.target === b)?.value;
        expect(link(materialNodeId("steel"), "gear")).toBeCloseTo(0.4, 10);
        expect(link("gear", "motor")).toBeCloseTo(8, 10);
        expect(link("coil", "motor")).toBeCloseTo(0.5, 10);
        // Inputs reach $8.50 of a $20 price: the gear's $7.60 over its steel
        // and the motor's $11.50 over its inputs enter as labour and
        // overhead (no margins known here), so no sink is needed.
        expect(link(CONVERSION_ID, "gear")).toBeCloseTo(7.6, 10);
        expect(link(CONVERSION_ID, "motor")).toBeCloseTo(11.5, 10);
        expect(link("motor", SALE_ID)).toBeUndefined();
        // With margins, each maker's gross profit splits off its step.
        const m = toSankey(
            CASE,
            "cost",
            PRICES,
            (id) => ({ motorco: 0.25, gearco: 0.4 })[id as "motorco"],
        );
        const mlink = (a: string, b: string) =>
            m.links.find((l) => l.source === a && l.target === b)?.value;
        expect(mlink(PROFIT_ID, "motor")).toBeCloseTo(5, 10);
        expect(mlink(CONVERSION_ID, "motor")).toBeCloseTo(6.5, 10);
        expect(mlink(PROFIT_ID, "gear")).toBeCloseTo(3.2, 10);
        const raw = toSankey(CASE, "raw", PRICES);
        expect(raw.links.find((l) => l.source === "gear")?.value).toBeCloseTo(0.4, 10);
        expect(raw.nodes.some((n) => n.id === SALE_ID)).toBe(false);
        expect(raw.nodes.some((n) => n.id === CONVERSION_ID)).toBe(false);
    });

    test("cost stack: raw, what tiers below added, conversion and profit add up", () => {
        const gm = (id: string) => ({ motorco: 0.25 })[id as "motorco"];
        const st = costStack(motor, "2026-09", PRICES, gm);
        expect(st?.raw).toBeCloseTo(0.9, 10);
        // Inputs $8.50 less their $0.90 of raw material.
        expect(st?.below).toBeCloseTo(7.6, 10);
        expect(st?.profit).toBeCloseTo(5, 10);
        expect(st?.conversion).toBeCloseTo(6.5, 10);
        expect(
            (st?.raw ?? 0) +
                (st?.below ?? 0) +
                (st?.conversion ?? 0) +
                (st?.profit ?? 0),
        ).toBeCloseTo(20, 10);
        expect(st?.short).toBe(false);
        expect(costStack(coil, "2026-09", PRICES)).toBeNull();
        const tight = costStack({ ...motor, unitCost: usd(8) }, "2026-09", PRICES, gm);
        expect(tight?.short).toBe(true);
        expect(massOf(motor)).toBe(250);
    });
});

describe("BOM cases", () => {
    test("pass their integrity rules", () => {
        expect(bomErrors()).toEqual([]);
    });

    test("each case has 45 to 90 nodes and names at least 8 companies", () => {
        for (const c of BOM_CASES) {
            const placed = flatten(c.root);
            expect(placed.length).toBeGreaterThanOrEqual(45);
            expect(placed.length).toBeLessThanOrEqual(90);
            const companies = new Set(
                placed.flatMap((p) => [
                    ...(p.node.makerIds ?? []),
                    ...(p.node.alternateMakerIds ?? []),
                ]),
            );
            expect(companies.size).toBeGreaterThanOrEqual(8);
        }
    });

    test("modeled parts add up to the published mass within 15%", () => {
        for (const c of BOM_CASES.filter((x) => x.massG)) {
            const g = flatten(c.root).reduce(
                (s, p) => s + (p.node.material?.massG.value ?? 0) * p.count,
                0,
            );
            expect(Math.abs(g / (c.massG?.value ?? 1) - 1)).toBeLessThan(0.15);
        }
    });

    test("part costs never exceed the price, and every case has a positive idiot index", () => {
        for (const c of BOM_CASES) {
            for (const kid of c.root.children ?? [])
                expect(kid.unitCost?.value ?? 0).toBeLessThanOrEqual(c.price.value);
            expect(idiotIndex(c.root, c.month) ?? 0).toBeGreaterThan(1);
        }
    });

    test("rotor magnets link to /manufacturing steps and the 3D scene", () => {
        for (const c of BOM_CASES) {
            const magnet = flatten(c.root).find(
                (p) => p.node.id === "rotor-magnet",
            )?.node;
            expect(magnet?.processStepIds?.every(isProcessStepId)).toBe(true);
            expect(partFor(c, "rotor-magnet")).toBe("rotor");
            expect(caseScene(c).parts.every((p) => p.bomNodeId === p.id)).toBe(true);
        }
        expect(caseWithNode("rotor-magnet")?.slug).toBe("optimus-linear");
    });

    test("every part says how it is made, and priced parts have a cost stack", () => {
        for (const c of BOM_CASES) {
            const m = nodeMetrics(c);
            for (const { node } of flatten(c.root)) {
                if (node.kind !== "component") continue;
                expect(
                    (node.route?.length ?? 0) + (node.processStepIds?.length ?? 0),
                ).toBeGreaterThan(0);
                if (node.unitCost) expect(m.get(node.id)?.stack?.short).toBe(false);
            }
        }
    });

    test("used-in thumbnails come from catalog data, never hotlinks", () => {
        for (const c of BOM_CASES) {
            const uses = usesOf(c);
            expect(uses.length).toBeGreaterThan(0);
            for (const u of uses) {
                if (u.image)
                    expect(u.image).toMatch(
                        /^\/(robot|actuator)-images\/[a-z0-9-]+\.webp$/,
                    );
                if (u.href) expect(u.href.startsWith("/")).toBe(true);
            }
        }
        const by = (slug: string) =>
            usesOf(BOM_CASES.find((c) => c.slug === slug) as BomCase);
        expect(by("unitree-qdd")[0]).toMatchObject({
            kind: "actuator",
            relation: "this",
            href: "/actuators/unitree-go-m8010-6",
        });
        expect(
            by("optimus-linear").find((u) => u.name.startsWith("Optimus")),
        ).toMatchObject({ relation: "this", count: 14, image: null });
        expect(by("harmonic-frameless").find((u) => u.name === "Asimov 1")?.image).toBe(
            "/robot-images/menlo-asimov-1.webp",
        );
    });

    test("slug parsing", () => {
        expect(bomSlugOf("/bom/unitree-qdd")).toBe("unitree-qdd");
        expect(bomSlugOf("/bom")).toBeNull();
        expect(bomSlugOf("/bom/nope")).toBeNull();
    });
});
