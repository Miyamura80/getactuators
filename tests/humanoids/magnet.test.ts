import { describe, expect, test } from "bun:test";
import {
    HUMANOIDS,
    REE_FRACTION,
    SIZE_CLASSES,
    getHumanoid,
    humanoidTotals,
    magnetRangeG,
    reeTotalKg,
} from "@/humanoids";
import {
    jointMagnetG,
    reeSplit,
    sizeClassForForce,
    sizeClassForTorque,
} from "@/humanoids/magnet";

describe("magnet mass method", () => {
    test("one motor's magnet is pi x D x L x t x fill x 7.5 g/cm3", () => {
        // L class: 80 mm airgap, 20 mm stack, 3 to 4 mm magnets, 70 to 90% fill.
        const ring = Math.PI * 8 * 2;
        const [lo, hi] = magnetRangeG("l");
        expect(lo).toBeCloseTo(ring * 0.3 * 0.7 * 7.5, 1);
        expect(hi).toBeCloseTo(ring * 0.4 * 0.9 * 7.5, 1);
        expect([lo, hi]).toEqual([79.2, 135.7]);
    });

    test("classes grow monotonically and bracket published 50 to 100 g per motor", () => {
        const ranges = SIZE_CLASSES.map((c) => magnetRangeG(c.id));
        for (let i = 1; i < ranges.length; i++) {
            expect(ranges[i]![0]).toBeGreaterThan(ranges[i - 1]![0]);
            expect(ranges[i]![1]).toBeGreaterThan(ranges[i - 1]![1]);
        }
        expect(magnetRangeG("m")[0]).toBeLessThanOrEqual(50);
        expect(magnetRangeG("l")[1]).toBeGreaterThanOrEqual(100);
    });

    test("torque and force pick the class at inclusive bounds", () => {
        expect(sizeClassForTorque(10)).toBe("xs");
        expect(sizeClassForTorque(10.1)).toBe("s");
        expect(sizeClassForTorque(40)).toBe("s");
        expect(sizeClassForTorque(100)).toBe("m");
        expect(sizeClassForTorque(139)).toBe("l");
        expect(sizeClassForTorque(360)).toBe("xl");
        expect(sizeClassForForce(500)).toBe("s");
        expect(sizeClassForForce(3900)).toBe("m");
        expect(sizeClassForForce(8000)).toBe("l");
    });

    test("a node multiplies by count, and hydraulics carry no magnet", () => {
        const one = magnetRangeG("s");
        const three = jointMagnetG("s", 3, "planetary");
        expect(three.range[0]).toBeCloseTo(one[0] * 3, 1);
        expect(three.range[1]).toBeCloseTo(one[1] * 3, 1);
        expect(three.value).toBeCloseTo((three.range[0] + three.range[1]) / 2, 1);
        expect(jointMagnetG("xs", 21, "hydraulic")).toEqual({
            value: 0,
            range: [0, 0],
        });
    });

    test("rare earths split by grade fractions and stay inside the magnet", () => {
        const split = reeSplit([1, 2]);
        expect(split.nd).toEqual([REE_FRACTION.nd[0], 2 * REE_FRACTION.nd[1]]);
        const highShare = split.nd[1] + split.pr[1] + split.dy[1] + split.tb[1];
        expect(highShare / 2).toBeLessThan(0.4);
        expect(REE_FRACTION.nd[0] + REE_FRACTION.pr[0]).toBeCloseTo(0.29 * 0.95, 5);
    });

    test("robot totals are the sum of joint ranges", () => {
        const kbot = getHumanoid("kscale-kbot");
        if (!kbot) throw new Error("missing K-Bot");
        const t = humanoidTotals(kbot);
        const lo = kbot.joints.reduce((s, j) => s + (j.magnetMassG.range?.[0] ?? 0), 0);
        const hi = kbot.joints.reduce((s, j) => s + (j.magnetMassG.range?.[1] ?? 0), 0);
        expect(t.magnetMassKg.range?.[0]).toBeCloseTo(lo / 1000, 2);
        expect(t.magnetMassKg.range?.[1]).toBeCloseTo(hi / 1000, 2);
        expect(t.actuators).toBe(20);
        expect(t.actuatorCountByType).toEqual({ qdd: 20 });
        const ree = reeTotalKg(t);
        expect(ree.range[0]).toBeLessThan(ree.value);
        expect(ree.range[1]).toBeGreaterThan(ree.value);
    });

    test("every robot's high magnet estimate stays within the published 4.5 kg per-robot ceiling", () => {
        for (const h of HUMANOIDS) {
            const t = humanoidTotals(h);
            expect({ id: h.id, over: (t.magnetMassKg.range?.[1] ?? 0) > 4.5 }).toEqual({
                id: h.id,
                over: false,
            });
            expect(t.magnetMassKg.confidence).toBe("estimated");
        }
    });
});
