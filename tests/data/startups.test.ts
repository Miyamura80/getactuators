import { describe, expect, test } from "bun:test";
import { countryName } from "../../src/country-flag";
import { STARTUPS } from "../../src/startups";

describe("startups", () => {
    // country is a plain string, so catch typos the type system no longer does.
    test("every country is an ISO alpha-2 code with a known name", () => {
        for (const s of STARTUPS) {
            expect({ id: s.id, code: /^[A-Z]{2}$/.test(s.country) }).toEqual({
                id: s.id,
                code: true,
            });
            expect({ id: s.id, named: countryName(s.country) !== s.country }).toEqual({
                id: s.id,
                named: true,
            });
        }
    });
});
