import { describe, expect, test } from "bun:test";
import { ACTUATORS, ROBOTS } from "@/catalog";
import { jointRows, queryActuators, resolveJoints } from "@/catalog/query";

describe("queryActuators", () => {
    test("no filter returns every actuator sorted by id", () => {
        const all = queryActuators();
        expect(all).toHaveLength(ACTUATORS.length);
        const ids = all.map((a) => a.id);
        expect(ids).toEqual([...ids].sort());
    });

    test("category and numeric filters narrow results", () => {
        const heavy = queryActuators({ min_peak_torque_nm: 100 });
        expect(heavy.every((a) => (a.peak_torque_nm ?? 0) >= 100)).toBe(true);
        const servos = queryActuators({ category: "smart_servo" });
        expect(servos.length).toBeGreaterThan(0);
        expect(servos.every((a) => a.category === "smart_servo")).toBe(true);
    });

    test("sort puts unknown values last", () => {
        const sorted = queryActuators({ sort: "price_usd", order: "asc" });
        const firstNull = sorted.findIndex((a) => a.price_usd === null);
        if (firstNull >= 0) {
            expect(sorted.slice(firstNull).every((a) => a.price_usd === null)).toBe(
                true,
            );
        }
    });
});

test("resolveJoints resolves every joint with a named motor", () => {
    for (const r of ROBOTS)
        expect(resolveJoints(r).length).toBe(
            r.joints.filter((j) => j.motor !== null).length,
        );
});

test("jointRows keeps unnamed motors as null with their role and count", () => {
    const spot = ROBOTS.find((r) => r.id === "boston-dynamics-spot");
    if (!spot) throw new Error("missing spot");
    const rows = jointRows(spot);
    expect(rows.map((j) => j.count)).toEqual([4, 4, 4]);
    expect(rows.every((j) => j.motor === null)).toBe(true);
});
