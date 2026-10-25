import { describe, expect, test } from "bun:test";
import { COST_FIT, HUMANOIDS, getHumanoid } from "@/humanoids";
import {
    type BomItem,
    bomPriceShare,
    groupSlices,
    humanoidBom,
    unitCost,
} from "@/humanoids/bom";

const item = (key: string, value: number, count = 1): BomItem => ({
    key,
    label: key,
    type: "qdd",
    count,
    joints: [],
    unit: {
        value,
        unit: "USD",
        sources: ["catalog-fit"],
        asOf: "October 2026",
        confidence: "modeled",
        range: [value / 2, value * 2],
    },
});

const robot = (id: string) => {
    const h = getHumanoid(id);
    if (!h) throw new Error(`missing ${id}`);
    return h;
};

describe("actuator BOM aggregation", () => {
    test("keeps up to 7 parts as slices, sorted by value", () => {
        const slices = groupSlices(
            [1, 7, 3, 5, 2, 6, 4].map((v) => item(`p${v}`, v * 10)),
        );
        expect(slices.map((s) => s.key)).toEqual([
            "p7",
            "p6",
            "p5",
            "p4",
            "p3",
            "p2",
            "p1",
        ]);
    });

    test("folds everything past the top 6 into Other with summed counts and ranges", () => {
        const items = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => item(`p${v}`, v, 2));
        const slices = groupSlices(items);
        expect(slices).toHaveLength(7);
        const other = slices.at(-1);
        expect(other?.key).toBe("other");
        expect(other?.unit).toBeNull();
        expect(other?.count).toBe(6);
        expect(other?.value).toBe((1 + 2 + 3) * 2);
        expect(other?.range).toEqual([1 + 2 + 3, (1 + 2 + 3) * 4]);
    });

    test("value is unit x count and shares sum to 1", () => {
        const slices = groupSlices([item("a", 100, 3), item("b", 50, 2)]);
        expect(slices[0]?.value).toBe(300);
        expect(slices[0]?.share).toBeCloseTo(0.75, 6);
        expect(slices.reduce((n, s) => n + s.share, 0)).toBeCloseTo(1, 9);
    });

    test("drops zero-value parts", () => {
        expect(groupSlices([item("a", 0), item("b", 10)]).map((s) => s.key)).toEqual([
            "b",
        ]);
    });

    test("every robot's total is the sum of its slices, within its range", () => {
        for (const h of HUMANOIDS) {
            for (const metric of ["cost", "mass", "magnet"] as const) {
                const b = humanoidBom(h, metric);
                const sum = b.slices.reduce((n, s) => n + s.value, 0);
                expect(b.total.value).toBeCloseTo(sum, 1);
                expect(b.total.range[0]).toBeLessThanOrEqual(b.total.value + 0.01);
                expect(b.total.range[1]).toBeGreaterThanOrEqual(b.total.value - 0.01);
                const acts = b.slices.filter((s) => s.category === "actuator");
                expect(acts.length).toBeLessThanOrEqual(7);
                expect(b.slices.length - acts.length).toBeLessThanOrEqual(5);
                expect(b.actuators.value).toBeCloseTo(
                    acts.reduce((n, s) => n + s.value, 0),
                    1,
                );
                expect(b.slices.reduce((n, s) => n + s.share, 0)).toBeCloseTo(1, 6);
            }
        }
    });
});

describe("rest of the robot", () => {
    test("Berkeley Humanoid Lite carries its itemized non-actuator BOM", () => {
        const b = humanoidBom(robot("berkeley-humanoid-lite"), "cost");
        const rest = b.slices.filter((s) => s.category === "non-actuator");
        expect(rest.map((s) => s.label)).toEqual([
            "Compute & electronics",
            "Printed structure",
            "Grippers",
            "Battery",
            "Wiring, fasteners & other",
        ]);
        expect(rest.every((s) => s.unit?.confidence === "reported" && !s.lumped)).toBe(
            true,
        );
        // The paper's itemized parts plus its $3,512 of actuators make $4,312.
        expect(b.rest?.value).toBeCloseTo(4312 - 3512, 1);
        expect(b.total.value).toBeCloseTo(b.actuators.value + 800, 1);
        const share = b.actuators.value / b.total.value;
        const actShares = b.slices
            .filter((s) => s.category === "actuator")
            .reduce((n, s) => n + s.share, 0);
        expect(actShares).toBeCloseTo(share, 6);
    });

    test("Optimus shows one lumped, estimated rest-of-robot slice", () => {
        const b = humanoidBom(robot("tesla-optimus"), "cost");
        const rest = b.slices.filter((s) => s.category === "non-actuator");
        expect(rest).toHaveLength(1);
        expect(rest[0]?.lumped).toBe(true);
        expect(rest[0]?.unit?.confidence).toBe("estimated");
        expect(rest[0]?.range[1]).toBeCloseTo(55000 * 0.44, 0);
    });

    test("robots without a full BOM show actuators only", () => {
        const b = humanoidBom(robot("kscale-kbot"), "cost");
        expect(b.rest).toBeNull();
        expect(b.total).toEqual(b.actuators);
    });

    test("mass adds the published weight minus actuators, magnet never adds a rest", () => {
        const g1 = robot("unitree-g1");
        const mass = humanoidBom(g1, "mass");
        expect(mass.rest?.value).toBeCloseTo(35 - mass.actuators.value, 1);
        expect(mass.total.value).toBeCloseTo(35, 1);
        expect(mass.slices.at(-1)?.unit?.confidence).toBe("modeled");
        expect(humanoidBom(g1, "magnet").rest).toBeNull();
    });
});

describe("actuator unit cost sources", () => {
    test("K-Bot is costed from catalog list prices", () => {
        const b = humanoidBom(robot("kscale-kbot"), "cost");
        expect(b.slices.every((s) => s.unit?.confidence === "reported")).toBe(true);
        expect(b.total.value).toBeCloseTo(
            4 * 255 + 8 * 249.99 + 6 * 160.99 + 2 * 125,
            1,
        );
        expect(b.slices[0]?.unit?.sources).toEqual(["catalog:robstride-03"]);
    });

    test("Berkeley Humanoid Lite uses the paper's actuator prices", () => {
        const b = humanoidBom(robot("berkeley-humanoid-lite"), "cost");
        expect(b.actuators.value).toBe(12 * 188 + 10 * 136);
    });

    test("Optimus uses analyst estimates with ranges, the neck is left out", () => {
        const b = humanoidBom(robot("tesla-optimus"), "cost");
        for (const s of b.slices) {
            expect(s.unit?.confidence).toBe("estimated");
            expect(s.unit?.sources).toEqual(["huibo-optimus-bom", "ms-optimus-bom"]);
        }
        expect(b.excluded).toEqual([
            expect.objectContaining({
                count: 2,
                reason: "micro motor: no defensible unit cost",
            }),
        ]);
    });

    test("hydraulic hands are left out of the cost view", () => {
        const b = humanoidBom(robot("sanctuary-phoenix"), "cost");
        expect(b.excluded.find((e) => e.label === "Hand (hydraulic)")?.count).toBe(42);
    });

    test("modeled costs follow the catalog curve and refuse torques below its range", () => {
        const g1 = robot("unitree-g1");
        const knee = g1.joints.find((j) => j.canonical === "l-knee");
        if (!knee) throw new Error("no knee");
        const u = unitCost(g1, knee);
        if ("reason" in u) throw new Error(u.reason);
        expect(u.confidence).toBe("modeled");
        expect(u.value).toBeCloseTo(COST_FIT.coef * 139 ** COST_FIT.exp, 0);
        const neck = robot("booster-t1").joints.find((j) => j.canonical === "neck");
        if (!neck) throw new Error("no neck");
        expect(unitCost(robot("booster-t1"), neck)).toEqual({
            reason: `below the catalog price fit range (${COST_FIT.minTorque} N·m)`,
        });
    });

    test("price share appears only when the robot has a price", () => {
        const g1 = robot("unitree-g1");
        const share = bomPriceShare(g1, humanoidBom(g1, "cost"));
        expect(share?.value).toBeCloseTo(
            humanoidBom(g1, "cost").total.value / 13500,
            6,
        );
        const atlas = robot("boston-dynamics-atlas");
        expect(bomPriceShare(atlas, humanoidBom(atlas, "cost"))).toBeNull();
        expect(bomPriceShare(g1, humanoidBom(g1, "mass"))).toBeNull();
    });
});
