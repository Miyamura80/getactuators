import { describe, expect, test } from "bun:test";
import {
    ASSIGNEE_ALIASES,
    aliasFor,
    cleanAssigneeName,
    normaliseAssignee,
} from "@/patents/assignees";
import { patentsLicenceErrors } from "@/patents/licence";
import { SHARED_CODES, TECHNOLOGIES, classifyFamily } from "@/patents/technologies";
import { COMPANIES } from "@/supply-chain/companies";

const nested = (a: string, b: string) => a.startsWith(b) || b.startsWith(a);

describe("technology code sets", () => {
    test("every technology has at least one code, each with a rationale", () => {
        expect(TECHNOLOGIES.length).toBeGreaterThanOrEqual(10);
        for (const t of TECHNOLOGIES) {
            expect(t.codes.length, t.id).toBeGreaterThan(0);
            for (const c of t.codes) {
                expect(c.code, t.id).toMatch(/^[A-H]\d{2}[A-Z]\d{1,4}\/\d{2,6}$/);
                expect(c.why.trim().length, `${t.id} ${c.code}`).toBeGreaterThan(20);
            }
            const filtered = t.codes.some((c) => "filtered" in c && c.filtered);
            expect("filter" in t, `${t.id}: filtered codes need a filter`).toBe(
                filtered,
            );
        }
    });

    test("ids are unique and no code repeats inside a technology", () => {
        expect(new Set(TECHNOLOGIES.map((t) => t.id)).size).toBe(TECHNOLOGIES.length);
        for (const t of TECHNOLOGIES) {
            const codes = t.codes.map((c) => c.code);
            expect(new Set(codes).size, t.id).toBe(codes.length);
        }
    });

    test("code sets only overlap across technologies where SHARED_CODES says so", () => {
        const pairs = TECHNOLOGIES.flatMap((a, i) =>
            TECHNOLOGIES.slice(i + 1).flatMap((b) =>
                a.codes.flatMap((ca) =>
                    b.codes
                        .filter((cb) => nested(ca.code, cb.code))
                        .map((cb) => ({
                            where: `${a.id} ${ca.code} / ${b.id} ${cb.code}`,
                            // The narrower (or equal) code must be declared shared.
                            inner: ca.code.length >= cb.code.length ? ca.code : cb.code,
                        })),
                ),
            ),
        );
        const unexpected = pairs
            .filter((p) => !SHARED_CODES[p.inner])
            .map((p) => p.where);
        const used = new Set<string>(
            pairs.map((p) => p.inner).filter((c) => SHARED_CODES[c]),
        );
        expect(unexpected).toEqual([]);
        // No stale entries either.
        expect([...used].sort()).toEqual(Object.keys(SHARED_CODES).sort());
    });

    test("classifies by code, filter, co-code and exclusion", () => {
        // Unfiltered code
        expect(classifyFamily(["F16H49/001"], [])).toEqual(["strain-wave"]);
        // Filtered code: title keyword decides
        expect(classifyFamily(["F16H1/28"], ["Planetary gearbox for a car"])).toEqual(
            [],
        );
        expect(classifyFamily(["F16H1/28"], ["Robot joint planetary reducer"])).toEqual(
            ["planetary"],
        );
        // ...or a co-code passes the filter
        expect(classifyFamily(["F16H25/2204", "B25J9/1065"], ["Ball screw"])).toContain(
            "screws",
        );
        // The shared harmonic-drive code lands in both technologies
        expect(classifyFamily(["B25J9/1025"], ["Harmonic drive"])).toEqual([
            "robot-joints",
            "strain-wave",
        ]);
        // Rare-earth-free titles stay out of NdFeB even with an R-Fe-B code
        expect(
            classifyFamily(["H01F1/0579"], ["Iron nitride permanent magnet"]),
        ).toEqual([]);
        expect(
            classifyFamily(["H01F41/0253"], ["Rare-earth-free iron nitride magnet"]),
        ).toEqual(["re-free-magnets"]);
        expect(
            classifyFamily(["H01F41/0293"], ["Grain boundary diffusion of Tb"]),
        ).toEqual(["ndfeb"]);
        // H02N1/00 is a prefix of the electrostatic actuator codes, not of H02N1/04
        expect(classifyFamily(["H02N1/04"], ["Triboelectric actuator"])).toEqual([]);
        expect(classifyFamily(["H02N1/006"], ["Electrostatic actuator"])).toEqual([
            "artificial-muscles",
        ]);
    });
});

describe("assignee normalisation", () => {
    test("strips case and legal-form suffixes", () => {
        expect(
            cleanAssigneeName("Guangdong midea refrigeration equipment co ltd"),
        ).toBe("GUANGDONG MIDEA REFRIGERATION EQUIPMENT");
        expect(cleanAssigneeName("SCHAEFFLER TECHNOLOGIES AG & CO KG")).toBe(
            "SCHAEFFLER TECHNOLOGIES",
        );
        expect(cleanAssigneeName("CANON KK")).toBe("CANON");
        expect(cleanAssigneeName("OVALO GMBH")).toBe("OVALO");
        expect(cleanAssigneeName("Harmonic Drive Systems, Inc.")).toBe(
            "HARMONIC DRIVE SYSTEMS",
        );
    });

    test("groups subsidiaries under the parent and links registry companies", () => {
        expect(normaliseAssignee("NIDEC SHIMPO CORP")).toEqual({
            key: "nidec",
            name: "Nidec",
            company: "nidec",
        });
        expect(normaliseAssignee("NIHON DENSAN KK").key).toBe("nidec");
        expect(
            normaliseAssignee("FUJIAN CHANGTING GOLDEN DRAGON RARE EARTH CO LTD")
                .company,
        ).toBe("xiamen-tungsten");
        expect(normaliseAssignee("HITACHI METALS LTD").company).toBe("proterial");
        expect(normaliseAssignee("HITACHI ASTEMO LTD").name).toBe("Hitachi");
        expect(normaliseAssignee("BOSCH GMBH ROBERT").key).toBe(
            normaliseAssignee("ROBERT BOSCH CO LTD").key,
        );
        expect(normaliseAssignee("UNIV NANJING AERONAUTICS & ASTRONAUTICS")).toEqual({
            key: "UNIV NANJING AERONAUTICS & ASTRONAUTICS",
            name: "Univ Nanjing Aeronautics & Astronautics",
        });
    });

    test("alias patterns are already clean and company ids exist", () => {
        const ids = new Set(COMPANIES.map((c) => c.id));
        for (const a of ASSIGNEE_ALIASES) {
            for (const m of a.match) {
                expect(cleanAssigneeName(m), a.name).toBe(m);
                // An earlier, broader alias must not swallow this pattern.
                expect(aliasFor(m)?.name, m).toBe(a.name);
            }
            if (a.company) expect(ids.has(a.company), a.company).toBe(true);
        }
    });
});

test("the /patents citation audit passes", () => {
    expect(patentsLicenceErrors()).toEqual([]);
});
