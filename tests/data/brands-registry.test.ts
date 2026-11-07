import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import actuators from "../../frontend/src/data/actuators.json";
import robots from "../../frontend/src/data/robots.json";
import { BRANDS, brandInitials, logoUrl, resolveBrand } from "../../src/brands";
import selfHosted from "../../src/brands/self-hosted.json";
import { HUMANOIDS } from "../../src/humanoids";
import { COMPANIES, FUNDS } from "../../src/investors";
import { STARTUPS } from "../../src/startups";
import { COMPANIES as SUPPLY_COMPANIES } from "../../src/supply-chain/companies";
import { DOMINANCE_MARKETS } from "../../src/supply-chain/perspective";

// Every company name a page shows, from every dataset on the site.
const referenced: string[] = [
    ...actuators.map((a) => a.brand),
    ...Object.values(robots.robots).map((r) => r.brand),
    ...Object.values(robots.motors).map((m) => m.brand),
    robots.credit.org,
    ...HUMANOIDS.map((h) => h.brand),
    ...STARTUPS.map((s) => s.name),
    ...STARTUPS.flatMap((s) => (s.leadInvestor ? [s.leadInvestor] : [])),
    ...Object.keys(COMPANIES),
    ...Object.values(COMPANIES).map((c) => c.name),
    ...FUNDS.map((f) => f.name),
    ...SUPPLY_COMPANIES.map((c) => c.name),
    ...DOMINANCE_MARKETS.filter((m) => m.kind === "company").flatMap((m) =>
        Object.keys(m.shares.value).filter((k) => k !== "other"),
    ),
];

describe("brand registry", () => {
    test("every referenced brand resolves to an entry", () => {
        const missing = [...new Set(referenced)].filter((n) => !resolveBrand(n));
        expect(missing).toEqual([]);
    });

    test("ids are unique and domains are bare hostnames or explicit null", () => {
        const ids = BRANDS.map((b) => b.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const b of BRANDS) {
            if (b.domain === null) continue;
            expect(b.domain).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/);
        }
    });

    test("dataset spellings land on the right company", () => {
        expect(resolveBrand("CubeMars (T-Motor)")?.id).toBe("cubemars");
        expect(resolveBrand("Harmonic Drive LLC")?.id).toBe("harmonic-drive");
        expect(resolveBrand("Waveshare (Feetech OEM)")?.id).toBe("waveshare");
        expect(resolveBrand("Menlo")?.id).toBe("menlo-ventures");
        expect(resolveBrand("Menlo Research")?.id).toBe("menlo-research");
        expect(resolveBrand("Unitree Robotics")?.id).toBe("unitree");
        expect(resolveBrand("Harmonic Drive Systems")?.id).toBe(
            "harmonic-drive-systems",
        );
        expect(resolveBrand("UBTECH Robotics")?.id).toBe("ubtech");
        expect(resolveBrand("Figure AI")?.id).toBe("figure");
        expect(resolveBrand("1X Technologies")?.id).toBe("1x");
        expect(resolveBrand("westmag")?.logo).toBe("/logos/startups/westmag.png");
    });

    test("every self-hosted logo is a registered company with a file and a source", () => {
        for (const r of selfHosted) {
            expect({ id: r.id, registered: Boolean(resolveBrand(r.id)) }).toEqual({
                id: r.id,
                registered: true,
            });
            expect({ id: r.id, file: existsSync(`frontend/public${r.logo}`) }).toEqual({
                id: r.id,
                file: true,
            });
            expect(r.source.length).toBeGreaterThan(0);
            expect(resolveBrand(r.id)?.logo).toBe(r.logo);
        }
    });

    test("monogram initials", () => {
        expect(brandInitials("Harmonic Drive")).toBe("HD");
        expect(brandInitials("mjbots")).toBe("MJ");
        expect(brandInitials("VESC / Trampa")).toBe("VT");
    });

    test("logo URL needs a publishable token", () => {
        expect(logoUrl("unitree.com", 16, "")).toBeNull();
        expect(logoUrl("unitree.com", 16, "sk_secret123")).toBeNull();
        expect(logoUrl("unitree.com", 16, 'pk_bad id"')).toBeNull();
        expect(logoUrl("unitree.com", 16, "pk_abc123")).toBe(
            "https://img.logo.dev/unitree.com?token=pk_abc123&size=16&format=png&theme=dark&retina=true&fallback=404",
        );
    });
});
