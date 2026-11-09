import { describe, expect, test } from "bun:test";
import {
    JAPAN_SOURCES,
    JAPAN_UNOPENED,
    japanUnopenedSourceErrors,
} from "@/supply-chain/country-pages/japan-sources";

describe("japan sources opened state", () => {
    test("unopened ids name sources, and only they lack an accessed date", () => {
        expect(japanUnopenedSourceErrors()).toEqual([]);
        expect(japanUnopenedSourceErrors([])).toHaveLength(JAPAN_UNOPENED.size);
        const undated = JAPAN_SOURCES.filter((s) => !s.accessed).map((s) => s.id);
        expect(undated.sort()).toEqual([...JAPAN_UNOPENED].sort());
    });
});
