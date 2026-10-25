import { expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import {
    APPLICATION_GROUPS,
    TYPE_GROUPS,
    applicationsOf,
    galleryCards,
    galleryGroups,
} from "@/catalog/gallery";

test("type grouping shows every catalog actuator exactly once, in type order", () => {
    const sections = galleryGroups(ACTUATORS, "type");
    const ids = sections.flatMap((s) => s.cards.map(({ a }) => a.id));
    expect(ids).toHaveLength(ACTUATORS.length);
    expect(new Set(ids).size).toBe(ACTUATORS.length);
    expect(sections.map((s) => s.key)).toEqual(
        TYPE_GROUPS.map((g) => g.key).filter((k) =>
            ACTUATORS.some((a) => a.category === k),
        ),
    );
    for (const s of sections)
        expect(s.cards.every(({ a }) => a.category === s.key)).toBe(true);
    expect(galleryCards(ACTUATORS)).toEqual(sections.flatMap((s) => s.cards));
});

test("every actuator lands in at least one application section", () => {
    const sections = galleryGroups(ACTUATORS, "application");
    const seen = new Set(sections.flatMap((s) => s.cards.map(({ a }) => a.id)));
    expect(seen.size).toBe(ACTUATORS.length);
    const keys = new Set(APPLICATION_GROUPS.map((g) => g.key));
    for (const a of ACTUATORS)
        expect(applicationsOf(a).every((k) => keys.has(k))).toBe(true);
});

test("generic robot_arm tags fall back to the hobby bucket instead of matching everything", () => {
    expect(applicationsOf({ use_cases: ["robot_arm"] })).toEqual(["hobby"]);
    expect(
        applicationsOf({ use_cases: ["robot_arm", "quadruped_leg", "cobot"] }),
    ).toEqual(["legged", "arms"]);
});

test("sections rank by torque density with nulls last and a wide leader, without mutating input", () => {
    const input = Array.from({ length: 6 }, (_, i) => ({
        id: `a${i}`,
        category: "smart_servo",
        use_cases: ["robot_arm"],
        peak_torque_nm: i,
        torque_density_nm_per_kg: i < 2 ? null : i,
        image_url: `/a${i}.webp`,
    }));
    const copy = structuredClone(input);
    const [section] = galleryGroups(input);
    expect(section?.cards.map(({ a, size }) => `${a.id}:${size}`)).toEqual([
        "a5:wide",
        "a4:sm",
        "a3:sm",
        "a2:sm",
        "a0:sm",
        "a1:sm",
    ]);
    expect(input).toEqual(copy);
    expect(galleryGroups([])).toEqual([]);
});
