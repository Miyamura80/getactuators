import { describe, expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import {
    HUMANOIDS,
    REE_FRACTION,
    SIZE_CLASSES,
    getHumanoid,
    humanoidTotals,
    magnetRangeG,
    reeTotalKg,
} from "@/humanoids";
import { TYPICAL_DRIVE, motorTorque, parseRatio } from "@/humanoids/drive";
import {
    jointMagnetG,
    reeSplit,
    sizeClassForMotorTorque,
    sizeMotor,
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

    test("motor torque picks the class at inclusive bounds", () => {
        expect(sizeClassForMotorTorque(0.5)).toBe("xs");
        expect(sizeClassForMotorTorque(0.51)).toBe("s");
        expect(sizeClassForMotorTorque(2)).toBe("s");
        expect(sizeClassForMotorTorque(8)).toBe("m");
        expect(sizeClassForMotorTorque(12)).toBe("l");
        expect(sizeClassForMotorTorque(14)).toBe("xl");
    });

    test("reference frameless kits land in their own class, magnets 5 to 25% of kit mass", () => {
        const kits = {
            "cubemars-ri60-kv120": "s",
            "cubemars-ri80-v2-kv75": "m",
            "tq-robodrive-ilm85x26": "l",
            "maxon-ec-frameless-90-flat-260w": "l",
        } as const;
        for (const [id, cls] of Object.entries(kits)) {
            const a = ACTUATORS.find((x) => x.id === id);
            if (!a?.peak_torque_nm || !a.weight_g) throw new Error(`missing ${id}`);
            expect({ id, cls: sizeClassForMotorTorque(a.peak_torque_nm) }).toEqual({
                id,
                cls,
            });
            const [lo, hi] = magnetRangeG(cls);
            expect(lo / a.weight_g).toBeGreaterThan(0.05);
            expect(hi / a.weight_g).toBeLessThan(0.25);
        }
    });

    test("motor torque is output over ratio x efficiency, screws force x lead over 2 pi x efficiency", () => {
        expect(motorTorque("rotary", 150, 50, 0.75)).toBeCloseTo(4, 5);
        expect(motorTorque("screw", 8000, 3, 0.85)).toBeCloseTo(
            (8000 * 0.003) / (2 * Math.PI * 0.85),
            5,
        );
        expect(parseRatio("9:1")).toBe(9);
        expect(parseRatio("3D-printed cycloidal, 15:1")).toBe(15);
        expect(parseRatio("51:1-101:1")).toBe(51);
        expect(parseRatio("1:1")).toBeNull();
        expect(parseRatio(null)).toBeNull();
    });

    test("a high-ratio harmonic joint gets a much smaller magnet than a QDD joint of the same output torque", () => {
        const harmonic = sizeMotor("harmonic", "torque", 150, undefined);
        const qdd = sizeMotor("qdd", "torque", 150, undefined);
        if (!harmonic || !qdd) throw new Error("missing sizing");
        expect(harmonic.motorTorqueNm.value).toBeLessThan(qdd.motorTorqueNm.value / 5);
        const h = jointMagnetG(harmonic, 1);
        const q = jointMagnetG(qdd, 1);
        expect(h.value * 3).toBeLessThan(q.value);
        expect(h.range[1]).toBeLessThan(q.range[0]);
    });

    test("an unknown ratio falls back to the design's typical ratio, marked modeled", () => {
        const s = sizeMotor("harmonic", "torque", 160, undefined);
        const d = TYPICAL_DRIVE.harmonic;
        expect(s?.gearRatio.value).toBe(d.ratio);
        expect(s?.gearRatio.range).toEqual(d.ratioRange);
        expect(s?.gearRatio.confidence).toBe("modeled");
        expect(s?.motorTorqueNm.value).toBeCloseTo(160 / (d.ratio * d.efficiency), 2);
        const known = sizeMotor("harmonic", "torque", 160, {
            value: 50,
            sources: ["x"],
            confidence: "reported",
            note: "",
        });
        expect(known?.gearRatio.confidence).toBe("reported");
        expect(known?.gearRatio.range).toEqual([50, 50]);
        expect(known?.motorTorqueNm.value).toBeGreaterThan(s?.motorTorqueNm.value ?? 0);
    });

    test("fleet joints use a published ratio when they have one", () => {
        const kbot = getHumanoid("kscale-kbot");
        const knee = kbot?.joints.find((j) => j.actuatorId === "robstride-04");
        expect(knee?.motorSizing?.gearRatio.value).toBe(9);
        expect(knee?.motorSizing?.gearRatio.sources).toEqual(["catalog:robstride-04"]);
        const g1 = getHumanoid("unitree-g1");
        const n7520 =
            g1?.joints.filter((j) => j.motor?.startsWith("Unitree N7520")) ?? [];
        // 88 N·m at 14.3:1 and 139 N·m at 22.5:1 are the same N7520 motor.
        const motor = new Set(
            n7520.map((j) => Math.round(j.motorSizing?.motorTorqueNm.value ?? 0)),
        );
        expect(motor).toEqual(new Set([7]));
        const optimus = getHumanoid("tesla-optimus");
        const hip = optimus?.joints.find((j) => j.canonical === "l-hip-yaw");
        expect(hip?.motorSizing?.gearRatio.confidence).toBe("modeled");
    });

    test("a node multiplies by count, and hydraulics carry no magnet", () => {
        const s = sizeMotor("planetary", "torque", 25, {
            value: 16,
            sources: [],
            confidence: "reported",
            note: "",
        });
        const one = magnetRangeG(s?.sizeClass ?? "xs");
        const three = jointMagnetG(s, 3);
        expect(s?.classRange).toEqual(["s", "s"]);
        expect(three.range[0]).toBeCloseTo(one[0] * 3, 1);
        expect(three.range[1]).toBeCloseTo(one[1] * 3, 1);
        expect(three.value).toBeCloseTo((three.range[0] + three.range[1]) / 2, 1);
        expect(sizeMotor("hydraulic", "torque", 100, undefined)).toBeNull();
        expect(jointMagnetG(null, 21)).toEqual({ value: 0, range: [0, 0] });
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
        const mid = kbot.joints.reduce((s, j) => s + j.magnetMassG.value, 0);
        expect(t.magnetMassKg.value).toBeCloseTo(mid / 1000, 2);
        expect(t.actuators).toBe(20);
        expect(t.actuatorCountByType).toEqual({ qdd: 20 });
        const ree = reeTotalKg(t);
        expect(ree.range[0]).toBeLessThan(ree.value);
        expect(ree.range[1]).toBeGreaterThan(ree.value);
    });

    test("every robot's magnet estimate stays within the published 4.5 kg per-robot ceiling", () => {
        // The high bound can pass it where an unknown ratio spans motor classes.
        for (const h of HUMANOIDS) {
            const t = humanoidTotals(h);
            const over =
                t.magnetMassKg.value > 4.5 || (t.magnetMassKg.range?.[1] ?? 0) > 5;
            expect({ id: h.id, over }).toEqual({ id: h.id, over: false });
            expect(t.magnetMassKg.confidence).toBe("estimated");
        }
    });
});
