// Pure logic tests for the URL <-> FilterState codec: round-trip, non-default
// serialization only, unknown-slug dropping, and the prototype-pollution guard
// on the sort key. No DOM, no network.
import { describe, expect, test } from "bun:test";
import type { FilterState } from "../src/lib/filter";
import { DEFAULT_FILTERS, filtersFromQuery, filtersToQuery } from "../src/lib/filter";

describe("filtersToQuery", () => {
    test("the default state serializes to an empty string", () => {
        expect(filtersToQuery(DEFAULT_FILTERS)).toBe("");
    });

    test("only non-default values are written", () => {
        // sortKey/sortDir match the defaults, so neither should appear.
        const f: FilterState = {
            search: "rmd",
            categories: new Set(),
            useCases: new Set(),
            countries: new Set(),
            sortKey: DEFAULT_FILTERS.sortKey,
            sortDir: DEFAULT_FILTERS.sortDir,
        };
        const q = filtersToQuery(f);
        expect(q).toBe("?q=rmd");
        expect(q).not.toContain("sort=");
        expect(q).not.toContain("dir=");
    });

    test("a non-default sort key and direction are written", () => {
        const f: FilterState = {
            search: "",
            categories: new Set(),
            useCases: new Set(),
            countries: new Set(),
            sortKey: "price_usd",
            sortDir: "asc",
        };
        const params = new URLSearchParams(filtersToQuery(f));
        expect(params.get("sort")).toBe("price_usd");
        expect(params.get("dir")).toBe("asc");
    });
});

describe("filtersFromQuery / round-trip", () => {
    test("a non-default state survives a round-trip", () => {
        const original: FilterState = {
            search: "harmonic drive",
            categories: new Set(["harmonic_precision", "smart_servo"]),
            useCases: new Set(["cobot", "robot_arm"]),
            countries: new Set(["South Korea", "Japan"]),
            sortKey: "peak_torque_nm",
            sortDir: "asc",
        };
        const back = filtersFromQuery(filtersToQuery(original));
        expect(back.search).toBe(original.search);
        expect([...back.categories].sort()).toEqual([...original.categories].sort());
        expect([...back.useCases].sort()).toEqual([...original.useCases].sort());
        expect([...back.countries].sort()).toEqual([...original.countries].sort());
        expect(back.sortKey).toBe(original.sortKey);
        expect(back.sortDir).toBe(original.sortDir);
    });

    test("an empty query yields the default state", () => {
        const f = filtersFromQuery("");
        expect(f.search).toBe("");
        expect(f.categories.size).toBe(0);
        expect(f.useCases.size).toBe(0);
        expect(f.sortKey).toBe(DEFAULT_FILTERS.sortKey);
        expect(f.sortDir).toBe(DEFAULT_FILTERS.sortDir);
    });

    test("unknown category slugs are dropped, known ones kept", () => {
        const f = filtersFromQuery("?cat=harmonic_precision,bogus_slug");
        expect([...f.categories]).toEqual(["harmonic_precision"]);
    });

    test("an invalid sort direction falls back to the default", () => {
        const f = filtersFromQuery("?dir=sideways");
        expect(f.sortDir).toBe(DEFAULT_FILTERS.sortDir);
    });

    test("an unknown sort key falls back to the default", () => {
        const f = filtersFromQuery("?sort=not_a_real_column");
        expect(f.sortKey).toBe(DEFAULT_FILTERS.sortKey);
    });
});

describe("filtersFromQuery prototype-pollution guard", () => {
    test("?sort=toString does not leak an inherited prototype member", () => {
        const f = filtersFromQuery("?sort=toString");
        // The guard must fall back to the default, never return "toString"
        // (which would later resolve to Object.prototype.toString and crash).
        expect(f.sortKey).not.toBe("toString");
        expect(f.sortKey).toBe(DEFAULT_FILTERS.sortKey);
    });

    test("other inherited members are rejected too", () => {
        for (const key of ["constructor", "hasOwnProperty", "valueOf"]) {
            expect(filtersFromQuery(`?sort=${key}`).sortKey).toBe(DEFAULT_FILTERS.sortKey);
        }
    });
});
