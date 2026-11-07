import { describe, expect, test } from "bun:test";
import { ROBOTS, ROBOT_KINDS, getActuator } from "@/catalog";
import { robotsUsingActuator } from "@/catalog/query";
import { robotLicenceErrors } from "@/catalog/robot-licence";
import { ROBOT_SOURCES } from "@/catalog/robot-sources";
import { BOM_CASES } from "@/supply-chain/bom";
import { usesOf } from "@/supply-chain/bom/used-in";

const EM_DASH = String.fromCharCode(0x2014);
const QUADRUPEDS = ROBOTS.filter((r) => r.kind === "quadruped");

describe("quadrupeds in the robots catalog", () => {
    test("every robot has a known kind, and quadrupeds are listed", () => {
        for (const r of ROBOTS) expect(ROBOT_KINDS).toContain(r.kind);
        expect(QUADRUPEDS.map((r) => r.id).sort()).toEqual(
            [
                "anybotics-anymal-d",
                "boston-dynamics-spot",
                "deep-robotics-lite3",
                "deep-robotics-x30",
                "ghost-robotics-vision-60",
                "rainbow-rbq-10",
                "unitree-b2",
                "unitree-go1",
                "unitree-go2",
                "xiaomi-cyberdog-2",
            ].sort(),
        );
    });

    test("sources are registered with a reuse value and pass the licence audit", () => {
        expect(robotLicenceErrors()).toEqual([]);
        for (const r of QUADRUPEDS) expect(r.sources.length).toBeGreaterThan(0);
    });

    test("whole-body payloads, no reach, and no photos hotlinked", () => {
        for (const r of QUADRUPEDS) {
            expect(r.payload_basis).toBe("whole_body");
            expect(r.reach_mm).toBeNull();
            expect(r.image_url ?? null).toBeNull();
        }
    });

    test("joint counts match the DOF where both are known", () => {
        for (const r of QUADRUPEDS) {
            const n = r.joints.reduce((s, j) => s + j.count, 0);
            if (r.dof != null && n > 0)
                expect({ id: r.id, n }).toEqual({ id: r.id, n: r.dof });
        }
    });

    test("Go1 runs the GO-M8010-6 and /bom links it from the catalog", () => {
        expect(getActuator("unitree-go-m8010-6")).toBeDefined();
        expect(robotsUsingActuator("unitree-go-m8010-6").map((r) => r.id)).toEqual([
            "unitree-go1",
        ]);
        const qdd = BOM_CASES.find((c) => c.slug === "unitree-qdd");
        if (!qdd) throw new Error("missing unitree-qdd");
        const go1 = usesOf(qdd).find((u) => u.name === "Go1");
        expect(go1?.href).toBe("/robots#unitree-go1");
        expect(go1?.count).toBe(12);
    });

    test("CyberDog 2 links Xiaomi's CyberGear", () => {
        expect(robotsUsingActuator("xiaomi-cybergear").map((r) => r.id)).toEqual([
            "xiaomi-cyberdog-2",
        ]);
    });

    test("no em dashes in robot text or sources", () => {
        expect(JSON.stringify(QUADRUPEDS)).not.toContain(EM_DASH);
        expect(JSON.stringify(ROBOT_SOURCES)).not.toContain(EM_DASH);
    });
});
