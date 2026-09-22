// Pure logic tests for applyFilters: search AND-matching, category and use-case
// filters, sort direction, and the null-to-bottom sort invariant. No DOM, no
// network, no data/actuators.json import (fixtures are built in-test).
import { describe, expect, test } from "bun:test";
import type { FilterState } from "../src/lib/filter";
import { applyFilters, DEFAULT_FILTERS } from "../src/lib/filter";
import { makeActuator } from "./fixtures";

function filters(overrides: Partial<FilterState> = {}): FilterState {
    return {
        search: "",
        categories: new Set(),
        useCases: new Set(),
        // No sort by default here so tests that only exercise the predicate keep
        // input order and read plainly; sort tests set sortKey explicitly.
        sortKey: "",
        sortDir: "desc",
        ...overrides,
    };
}

function ids(list: ReturnType<typeof makeActuator>[]): string[] {
    return list.map((a) => a.id);
}

describe("applyFilters search", () => {
    const list = [
        makeActuator({ id: "a", name: "RMD X8", brand: "MyActuator" }),
        makeActuator({ id: "b", name: "GIM8108", brand: "SteadyWin" }),
        makeActuator({ id: "c", name: "AK80-9", brand: "CubeMars", notes: "quadruped leg unit" }),
    ];

    test("matches on name", () => {
        expect(ids(applyFilters(list, filters({ search: "rmd" })))).toEqual(["a"]);
    });

    test("matches on brand", () => {
        expect(ids(applyFilters(list, filters({ search: "steadywin" })))).toEqual(["b"]);
    });

    test("matches on notes", () => {
        expect(ids(applyFilters(list, filters({ search: "quadruped" })))).toEqual(["c"]);
    });

    test("all terms must match (AND across fields)", () => {
        // "ak80" is in the name, "cubemars" in the brand: both present on one row.
        expect(ids(applyFilters(list, filters({ search: "ak80 cubemars" })))).toEqual(["c"]);
        // A term that no single row satisfies alongside the others yields nothing.
        expect(applyFilters(list, filters({ search: "rmd cubemars" }))).toHaveLength(0);
    });

    test("search is case-insensitive and whitespace-tolerant", () => {
        expect(ids(applyFilters(list, filters({ search: "  GIM8108  " })))).toEqual(["b"]);
    });

    test("empty search returns every row", () => {
        expect(applyFilters(list, filters({ search: "" }))).toHaveLength(3);
    });
});

describe("applyFilters category and use-case", () => {
    const list = [
        makeActuator({ id: "a", category: "qdd_proprioceptive", use_cases: ["quadruped_leg", "humanoid"] }),
        makeActuator({ id: "b", category: "smart_servo", use_cases: ["robot_arm"] }),
        makeActuator({ id: "c", category: "harmonic_precision", use_cases: ["cobot"] }),
    ];

    test("category filter keeps only matching slugs", () => {
        const f = filters({ categories: new Set(["qdd_proprioceptive", "smart_servo"]) });
        expect(ids(applyFilters(list, f))).toEqual(["a", "b"]);
    });

    test("use-case filter matches when any of a row's use_cases is selected", () => {
        const f = filters({ useCases: new Set(["humanoid"]) });
        expect(ids(applyFilters(list, f))).toEqual(["a"]);
    });

    test("category and use-case combine as AND", () => {
        const f = filters({
            categories: new Set(["qdd_proprioceptive"]),
            useCases: new Set(["robot_arm"]),
        });
        // Row a is the only qdd row, but it has no robot_arm use case.
        expect(applyFilters(list, f)).toHaveLength(0);
    });

    test("empty filter sets match everything", () => {
        expect(applyFilters(list, filters())).toHaveLength(3);
    });
});

describe("applyFilters sort", () => {
    const list = [
        makeActuator({ id: "low", torque_density_nm_per_kg: 5 }),
        makeActuator({ id: "high", torque_density_nm_per_kg: 30 }),
        makeActuator({ id: "mid", torque_density_nm_per_kg: 12 }),
    ];

    test("desc orders largest first", () => {
        const f = filters({ sortKey: "torque_density_nm_per_kg", sortDir: "desc" });
        expect(ids(applyFilters(list, f))).toEqual(["high", "mid", "low"]);
    });

    test("asc orders smallest first", () => {
        const f = filters({ sortKey: "torque_density_nm_per_kg", sortDir: "asc" });
        expect(ids(applyFilters(list, f))).toEqual(["low", "mid", "high"]);
    });

    test("an unknown sortKey leaves order untouched", () => {
        const f = filters({ sortKey: "not_a_column", sortDir: "asc" });
        expect(ids(applyFilters(list, f))).toEqual(["low", "high", "mid"]);
    });

    test("does not mutate the input array", () => {
        const before = ids(list);
        applyFilters(list, filters({ sortKey: "torque_density_nm_per_kg", sortDir: "asc" }));
        expect(ids(list)).toEqual(before);
    });
});

describe("applyFilters null-to-bottom invariant", () => {
    const list = [
        makeActuator({ id: "n1", torque_density_nm_per_kg: null }),
        makeActuator({ id: "v10", torque_density_nm_per_kg: 10 }),
        makeActuator({ id: "n2", torque_density_nm_per_kg: null }),
        makeActuator({ id: "v20", torque_density_nm_per_kg: 20 }),
    ];

    test("nulls sort to the bottom on desc", () => {
        const out = ids(applyFilters(list, filters({ sortKey: "torque_density_nm_per_kg", sortDir: "desc" })));
        expect(out.slice(0, 2)).toEqual(["v20", "v10"]);
        expect(new Set(out.slice(2))).toEqual(new Set(["n1", "n2"]));
    });

    test("nulls sort to the bottom on asc too", () => {
        const out = ids(applyFilters(list, filters({ sortKey: "torque_density_nm_per_kg", sortDir: "asc" })));
        expect(out.slice(0, 2)).toEqual(["v10", "v20"]);
        expect(new Set(out.slice(2))).toEqual(new Set(["n1", "n2"]));
    });
});

describe("DEFAULT_FILTERS", () => {
    test("defaults to torque-density, descending, with no active filters", () => {
        expect(DEFAULT_FILTERS.sortKey).toBe("torque_density_nm_per_kg");
        expect(DEFAULT_FILTERS.sortDir).toBe("desc");
        expect(DEFAULT_FILTERS.search).toBe("");
        expect(DEFAULT_FILTERS.categories.size).toBe(0);
        expect(DEFAULT_FILTERS.useCases.size).toBe(0);
    });
});
