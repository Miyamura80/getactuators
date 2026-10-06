// Smoke tests for the pure robot helpers: motorCount sums the joint loadout,
// and resolveJoints drops joints whose motor key is not in the catalog so a
// typo can never crash the render.
import { describe, expect, test } from "bun:test";
import { motorCount, resolveJoints, ROBOT_MOTORS } from "../src/lib/robots";
import type { Robot, RobotJoint } from "../src/types";

function makeRobot(joints: RobotJoint[]): Robot {
    return {
        id: "r",
        name: "Test Robot",
        brand: "Brand",
        kind: "robot_arm",
        country: null,
        country_flag: null,
        dof: joints.length,
        payload_kg: null,
        reach_mm: null,
        weight_kg: null,
        price_usd: null,
        price_max_usd: null,
        product_url: null,
        summary: "",
        joints,
        sources: [],
    };
}

describe("motorCount", () => {
    test("sums the count across all joints", () => {
        const robot = makeRobot([
            { role: "hip", motor: "x", count: 4 },
            { role: "knee", motor: "y", count: 4 },
            { role: "wrist", motor: "z", count: 2 },
        ]);
        expect(motorCount(robot)).toBe(10);
    });

    test("is zero for an empty loadout", () => {
        expect(motorCount(makeRobot([]))).toBe(0);
    });
});

describe("resolveJoints", () => {
    test("drops joints whose motor key is missing from the catalog", () => {
        const robot = makeRobot([
            { role: "hip", motor: "definitely_not_a_real_motor_key", count: 2 },
        ]);
        expect(resolveJoints(robot)).toEqual([]);
    });

    test("resolves a joint against a real catalog motor when present", () => {
        const key = Object.keys(ROBOT_MOTORS)[0];
        // Guard: the catalog ships with motors, so this key exists.
        expect(key).toBeDefined();
        const robot = makeRobot([{ role: "hip", motor: key, count: 3 }]);
        const resolved = resolveJoints(robot);
        expect(resolved).toHaveLength(1);
        expect(resolved[0].role).toBe("hip");
        expect(resolved[0].count).toBe(3);
        expect(resolved[0].motor).toBe(ROBOT_MOTORS[key]);
    });
});
