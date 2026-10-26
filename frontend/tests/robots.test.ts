// Smoke tests for the pure robot helpers: motorCount sums the joint loadout,
// and resolveJoints drops joints whose motor key is not in the catalog so a
// typo can never crash the render.
import { describe, expect, test } from "bun:test";
import { motorCount, resolveJoints, ROBOT_MOTORS, robotsUsingActuator } from "../src/lib/robots";
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

describe("robotsUsingActuator", () => {
    test("returns each robot whose loadout links the actuator, once", () => {
        const linked = makeRobot([
            { role: "head", motor: "dynamixel-xl330-m288", count: 5 },
            { role: "antenna", motor: "dynamixel-xl330-m288", count: 1 },
        ]);
        const other = { ...makeRobot([{ role: "arm", motor: "feetech-sts3215-c001", count: 6 }]), id: "other" };
        expect(robotsUsingActuator("dynamixel-xl330-m288-t", [linked, other]).map((r) => r.id)).toEqual(["r"]);
    });

    test("is empty for an actuator no loadout links", () => {
        expect(robotsUsingActuator("definitely-not-an-actuator")).toEqual([]);
    });

    test("finds the shipped Reachy Mini loadout for the XL330-M288-T", () => {
        expect(robotsUsingActuator("dynamixel-xl330-m288-t").map((r) => r.id)).toContain("pollen-reachy-mini");
    });

    test("resolves the off-the-shelf motors linked to catalog entries", () => {
        const ids = (actuatorId: string) => robotsUsingActuator(actuatorId).map((r) => r.id);
        expect(ids("damiao-dm-j4310-2ec")).toEqual(expect.arrayContaining(["i2rt-yam", "i2rt-big-yam", "manmaru-yor"]));
        expect(ids("damiao-dm-j6248p-2ec")).toEqual(["i2rt-big-yam"]);
        expect(ids("encos-ec-a6416-p2-25")).toEqual(["menlo-asimov-1"]);
        expect(ids("feetech-sts3215-c001")).toEqual(["therobotstudio-so-101"]);
        expect(ids("dynamixel-xc430-w240-t")).toEqual(["hello-robot-stretch-3"]);
    });

    test("keeps the 12V STS3215 apart from the 7.4V C001 the SO-101 uses", () => {
        expect(robotsUsingActuator("feetech-sts3215").map((r) => r.id)).not.toContain("therobotstudio-so-101");
    });
});
