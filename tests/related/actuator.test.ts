import { describe, expect, test } from "bun:test";
import { ACTUATORS, CATEGORIES } from "@/catalog";
import { getHumanoid } from "@/humanoids";
import { isLandscapeScope } from "@/patents";
import { CATEGORY_PATENTS, humanoidLinks, patentLinks } from "@/related/actuator";
import { actuatorBody } from "@/server/agent/catalog-md";

describe("actuator related links", () => {
    test("every catalog category links to at least one patent technology", () => {
        for (const c of CATEGORIES) {
            const links = patentLinks(c.slug);
            expect(links.length).toBeGreaterThan(0);
            for (const l of links) {
                const scope =
                    new URL(l.href, "https://x").searchParams.get("technology") ?? "";
                expect(isLandscapeScope(scope)).toBe(true);
            }
        }
        expect(Object.keys(CATEGORY_PATENTS).sort()).toEqual(
            CATEGORIES.map((c) => c.slug).sort(),
        );
    });

    test("humanoid links point at a real robot and one of its joints", () => {
        const links = humanoidLinks("robstride-04");
        expect(links.map((l) => l.label)).toContain("K-Bot");
        for (const l of links) {
            const q = new URL(l.href, "https://x").searchParams;
            const h = getHumanoid(q.get("robot") ?? "");
            expect(
                h?.joints.some(
                    (j) =>
                        j.canonical === q.get("joint") &&
                        j.actuatorId === "robstride-04",
                ),
            ).toBe(true);
        }
    });

    test("an actuator no humanoid uses has no humanoid links", () => {
        const unused = ACTUATORS.find((a) => humanoidLinks(a.id).length === 0);
        expect(unused).toBeDefined();
    });

    test("the markdown twin carries both sections", () => {
        const a = ACTUATORS.find((x) => x.id === "robstride-04");
        if (!a) throw new Error("robstride-04 missing from catalog");
        const md = actuatorBody(a);
        expect(md).toContain("## In humanoids");
        expect(md).toContain("## Patent landscape");
        expect(md).toContain("/patents?technology=");
    });
});
