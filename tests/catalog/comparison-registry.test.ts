import { expect, test } from "bun:test";
import { ACTUATORS, getActuator } from "@/catalog";
function model(id: string) {
    const record = getActuator(id);
    if (!record) throw new Error(`Missing test model: ${id}`);
    return record;
}
import { buildComparisonRegistry } from "@/catalog/comparison-registry";

test("catalog comparisons choose bounded same-category peers without manual pairs", async () => {
    const registry = await import("../../src/catalog/comparison-registry").catch(
        () => null,
    );
    expect(registry).not.toBeNull();
    if (!registry) return;
    const pairs = registry.buildComparisonRegistry(ACTUATORS);
    expect(pairs.length).toBeGreaterThan(20);
    expect(pairs.length).toBeLessThanOrEqual(ACTUATORS.length * 3);
    expect(new Set(pairs.map((p) => p.path)).size).toBe(pairs.length);
    for (const pair of pairs) {
        expect(pair.ids[0] < pair.ids[1]).toBe(true);
        const a = model(pair.ids[0]);
        const b = model(pair.ids[1]);
        expect(a.category).toBe(b.category);
        expect(pair.path).toBe(`/comparisons/${pair.ids.join("-vs-")}`);
    }
    expect(registry.buildComparisonRegistry([...ACTUATORS].reverse())).toEqual(pairs);
});

test("new models enter automatically; duplicate IDs and invalid peer caps cannot expand generation", () => {
    const template = model("cubemars-ak60-6");
    const added = { ...template, id: "new-actuator", name: "New exact SKU V2 KV80" };
    const records = [...ACTUATORS, added];
    expect(buildComparisonRegistry(records).some((p) => p.ids.includes(added.id))).toBe(
        true,
    );
    const duplicated = [...records, { ...added, peak_torque_nm: 999 }];
    expect(buildComparisonRegistry(duplicated)).toEqual(
        buildComparisonRegistry(duplicated.reverse()),
    );
    expect(
        buildComparisonRegistry(duplicated).some((p) => p.ids.includes(added.id)),
    ).toBe(false);
    expect(buildComparisonRegistry(records, 0)).toEqual([]);
    expect(buildComparisonRegistry(records, -1)).toEqual([]);
    expect(buildComparisonRegistry(records, 100)).toEqual(
        buildComparisonRegistry(records, 3),
    );
    expect(buildComparisonRegistry(records, Number.NaN)).toEqual(
        buildComparisonRegistry(records, 3),
    );
});

test("sparse, family, controller, zero and ambiguous IDs never create indexable pairs", () => {
    const base = model("cubemars-ak60-6");
    const invalid = [
        { ...base, id: "family", name: "Example family (all ratios)" },
        { ...base, id: "controller", name: "FOC controller" },
        { ...base, id: "sparse", rated_torque_nm: null, max_speed_rpm: null },
        { ...base, id: "zero", peak_torque_nm: 0, rated_torque_nm: 0 },
        {
            ...base,
            id: "nonfinite",
            weight_g: Number.NaN,
            max_speed_rpm: Number.POSITIVE_INFINITY,
        },
        { ...base, id: "not/a-slug" },
        { ...base, id: "ambiguous-vs-id" },
    ];
    expect(buildComparisonRegistry([base, ...invalid])).toEqual([]);
    const second = { ...base, id: "exact-sku", name: "Exact SKU 48V KV80" };
    expect(buildComparisonRegistry([base, second, ...invalid])).toHaveLength(1);
});

test("bounded nearest-peer lifecycle deliberately permits displacement on catalog insertion", () => {
    const before = buildComparisonRegistry(ACTUATORS);
    const records = [
        ...ACTUATORS,
        {
            ...model("myactuator-rmd-x8-120"),
            id: "aaa-new-exact-sku",
            name: "New exact SKU",
        },
    ];
    const after = buildComparisonRegistry(records);
    const retired = before
        .filter((pair) => !after.some((candidate) => candidate.path === pair.path))
        .map((pair) => pair.path);
    expect(retired).toEqual([
        "/comparisons/damiao-dm-j6248p-2ec-vs-robstride-04",
        "/comparisons/encos-ec-a4315-p2-36-vs-myactuator-rmd-x8-120",
    ]);
    expect(buildComparisonRegistry([...records].reverse())).toEqual(after);
    expect(after.length).toBeLessThanOrEqual(records.length * 3);
});

test("eligibility is pairwise and growth remains bounded with deterministic ties", () => {
    const base = model("cubemars-ak60-6");
    const a = { ...base, id: "a", weight_g: null };
    const b = { ...base, id: "b", rated_torque_nm: null };
    expect(buildComparisonRegistry([a, b])).toEqual([]);
    const records = Array.from({ length: 20 }, (_, index) => ({
        ...base,
        id: `model-${String(index).padStart(2, "0")}`,
    }));
    const pairs = buildComparisonRegistry(records);
    expect(pairs.length).toBeLessThanOrEqual(records.length * 3);
    expect(pairs.length).toBeLessThan((records.length * (records.length - 1)) / 2);
    expect(buildComparisonRegistry([...records].reverse())).toEqual(pairs);
    expect(pairs.some((pair) => pair.ids[0] === pair.ids[1])).toBe(false);
    expect(buildComparisonRegistry(records, 1).length).toBeLessThanOrEqual(
        records.length,
    );
});

test("pairs share every mechanical field and stay within a 3x torque ratio", () => {
    for (const pair of buildComparisonRegistry(ACTUATORS)) {
        const [a, b] = pair.ids.map(model);
        if (!a || !b) throw new Error(`Missing pair model: ${pair.path}`);
        for (const field of [
            "peak_torque_nm",
            "rated_torque_nm",
            "max_speed_rpm",
            "weight_g",
        ] as const) {
            expect(a[field]).toBeGreaterThan(0);
            expect(b[field]).toBeGreaterThan(0);
        }
        const [x, y] = [a.peak_torque_nm as number, b.peak_torque_nm as number];
        expect(Math.max(x, y) / Math.min(x, y)).toBeLessThanOrEqual(3);
    }
    const base = model("cubemars-ak60-6");
    const strong = {
        ...base,
        id: "strong",
        peak_torque_nm: (base.peak_torque_nm ?? 0) * 4,
    };
    const unrated = { ...base, id: "unrated", rated_torque_nm: null };
    expect(buildComparisonRegistry([base, strong])).toEqual([]);
    expect(buildComparisonRegistry([base, unrated])).toEqual([]);
});
