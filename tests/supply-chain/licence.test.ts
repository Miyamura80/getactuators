import { describe, expect, test } from "bun:test";
import { SOURCES as HUMANOID_SOURCES, sourceOf } from "@/humanoids/sources";
import {
    type Citation,
    type LicenceRegistry,
    humanoidCitations,
    humanoidLicenceErrors,
    licenceErrors,
} from "@/supply-chain/licence";
import {
    FACTS_MAX_RECORDS,
    RESTRICTED_MAX_RECORDS,
    SOURCE_REUSE,
} from "@/supply-chain/reuse";
import { SOURCES } from "@/supply-chain/sources";

// `n` records each citing `id`.
const cites = (id: string, n: number): Citation[] =>
    Array.from({ length: n }, (_, i) => [`record ${i}`, [id]]);

function registry(over: Partial<LicenceRegistry> = {}): LicenceRegistry {
    return {
        name: "test",
        file: "test/sources.ts",
        sources: [
            { id: "gov", reuse: "open" },
            { id: "news", reuse: "facts" },
            { id: "paid", reuse: "restricted" },
        ],
        citations: [
            ...cites("gov", 50),
            ...cites("news", FACTS_MAX_RECORDS),
            ...cites("paid", RESTRICTED_MAX_RECORDS),
        ],
        allowlist: {},
        ...over,
    };
}

describe("licence rules", () => {
    test("a registry within the limits passes", () => {
        expect(licenceErrors(registry())).toEqual([]);
    });

    test("a missing or unknown reuse fails and points to the guide", () => {
        const errors = licenceErrors(
            registry({
                sources: [{ id: "a" }, { id: "b", reuse: "free" }],
                citations: [],
            }),
        );
        expect(errors).toHaveLength(2);
        for (const e of errors) {
            expect(e).toContain("open, facts, restricted");
            expect(e).toContain('AGENTS.md "Data sourcing and licences"');
        }
    });

    test("a restricted source over its limit fails", () => {
        const errors = licenceErrors(
            registry({ citations: cites("paid", RESTRICTED_MAX_RECORDS + 1) }),
        );
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('"paid" is restricted');
    });

    test("a facts source over its limit fails unless allowlisted", () => {
        const citations = cites("news", FACTS_MAX_RECORDS + 1);
        const errors = licenceErrors(registry({ citations }));
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain("allowlist in test/sources.ts");
        expect(
            licenceErrors(
                registry({ citations, allowlist: { news: "One fact each." } }),
            ),
        ).toEqual([]);
    });

    test("an open source has no record limit", () => {
        expect(licenceErrors(registry({ citations: cites("gov", 500) }))).toEqual([]);
    });

    test("records are counted once however often they cite a source", () => {
        const citations: Citation[] = Array.from({ length: 20 }, () => [
            "one record",
            ["paid", "paid"],
        ]);
        expect(licenceErrors(registry({ citations }))).toEqual([]);
    });

    test("allowlist entries must be needed, facts, and give a reason", () => {
        const errors = licenceErrors(
            registry({
                allowlist: { news: "within limit", paid: "x", ghost: "x", gov: "" },
            }),
        );
        expect(errors.some((e) => e.includes('"news": backs'))).toBe(true);
        expect(errors.some((e) => e.includes('"paid": only facts'))).toBe(true);
        expect(errors.some((e) => e.includes('"ghost": no such source'))).toBe(true);
        expect(errors.some((e) => e.includes('"gov": needs a one-line reason'))).toBe(
            true,
        );
    });
});

describe("source registries", () => {
    test("every source has a valid reuse value", () => {
        const all = [...SOURCES, ...Object.values(HUMANOID_SOURCES)];
        for (const s of all) expect(SOURCE_REUSE).toContain(s.reuse);
    });

    test("catalog paths are our own data", () => {
        for (const s of Object.values(HUMANOID_SOURCES))
            if (s.url.startsWith("/")) expect(s.reuse).toBe("open");
        expect(sourceOf("catalog:tq-robodrive-ilm85x26").reuse).toBe("open");
    });

    test("paywalled sources are restricted", () => {
        for (const s of SOURCES.filter((x) => x.paywalled))
            expect(s.reuse).toBe("restricted");
    });

    test("humanoid data passes the licence rules", () => {
        expect(humanoidLicenceErrors()).toEqual([]);
        expect(humanoidCitations().length).toBeGreaterThan(15);
    });
});
