import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { auditRegistry } from "@/supply-chain/audit";
import { SEGMENTS } from "@/supply-chain/companies";
import { COUNTRIES } from "@/supply-chain/countries";
import { LAB_CLUSTERS, labNdStep, labRobotFlow } from "@/supply-chain/lab-kit";
import {
    ADMIN1_COUNTRIES,
    REFERENCE_CITIES,
    SEGMENT_COLOR,
    SEGMENT_PICTO,
    SEGMENT_SHORT,
    WORLD_FILE,
    admin1File,
    arcsTouching,
    mixPhrase,
    segmentMix,
    sitePins,
    supplyArcs,
} from "@/supply-chain/map";
import { groupPoints, mixSize } from "@/supply-chain/map-groups";
import { activeLinks, companyAnchor } from "@/supply-chain/registry";
import { SITES } from "@/supply-chain/sites";
import { feature } from "topojson-client";

const GEO = "frontend/public/geo";

function features(file: string): { properties: Record<string, string> }[] {
    const topo = JSON.parse(readFileSync(`${GEO}/${file}`, "utf8"));
    const key = Object.keys(topo.objects)[0] ?? "";
    return (
        feature(topo, topo.objects[key]) as unknown as {
            features: { properties: Record<string, string> }[];
        }
    ).features;
}

describe("geo assets", () => {
    test("every TopoJSON file is under 300 KB and licences are noted", () => {
        const files = readdirSync(GEO).filter((f) => f.endsWith(".json"));
        expect(files.sort()).toEqual(
            [...Object.values(WORLD_FILE), ...ADMIN1_COUNTRIES.map(admin1File)].sort(),
        );
        for (const f of files)
            expect(statSync(`${GEO}/${f}`).size).toBeLessThan(300 * 1024);
        const readme = readFileSync(`${GEO}/README.md`, "utf8");
        expect(readme).toContain("Natural Earth");
        expect(readme).toContain("public domain");
    });

    test("world files key countries by ISO alpha-2; admin-1 files by ISO 3166-2", () => {
        for (const f of Object.values(WORLD_FILE)) {
            const isos = new Set(features(f).map((x) => x.properties.iso));
            for (const code of ["CN", "JP", "KR", "US", "AU", "FR", "NO"])
                expect(isos.has(code)).toBe(true);
        }
        const counts = { JP: 47, KR: 17, US: 51 } as const;
        for (const code of ADMIN1_COUNTRIES) {
            const regions = features(admin1File(code));
            for (const r of regions)
                expect(r.properties.code?.startsWith(`${code}-`)).toBe(true);
            if (code in counts)
                expect(regions).toHaveLength(counts[code as keyof typeof counts]);
            else expect(regions.length).toBeGreaterThanOrEqual(31);
        }
    });
});

describe("map data", () => {
    test("one pin per site, carrying the company's segment", () => {
        const pins = sitePins();
        expect(pins).toHaveLength(SITES.length);
        const ganzhou = pins.find((p) => p.id === "jlmag-ganzhou");
        expect(ganzhou?.segment).toBe("magnets-motors");
        expect(ganzhou?.label).toContain("JL MAG");
    });

    test("arcs follow current links only, anchored at headquarters", () => {
        const arcs = supplyArcs();
        expect(arcs).toHaveLength(activeLinks().length);
        expect(arcs.some((a) => a.id === "mp-materials--shenghe-resources")).toBe(
            false,
        );
        const tesla = arcs.find((a) => a.id === "tuopu-group--tesla");
        expect(tesla?.to.country).toBe("US");
        expect(tesla?.confidence).toBe("estimated");
        expect(companyAnchor("tesla")?.kind).toBe("hq");
        // Nabtesco has no headquarters site: its first plant anchors it.
        expect(companyAnchor("nabtesco")?.id).toBe("nabtesco-tsu");
        expect(arcsTouching(arcs, "KR").map((a) => a.id)).toEqual([
            "hyundai-mobis--boston-dynamics",
        ]);
    });

    test("pins carry the short company label and region for on-map callouts", () => {
        const hotaka = sitePins().find((p) => p.id === "hds-hotaka");
        expect(hotaka?.company).toBe("Harmonic Drive Systems");
        expect(hotaka?.admin1).toBe("Nagano");
        expect(hotaka?.label.startsWith(`${hotaka?.company} · `)).toBe(true);
    });

    test("each segment has its own colour and short key name", () => {
        const colours = SEGMENTS.map((s) => SEGMENT_COLOR[s]);
        expect(new Set(colours).size).toBe(SEGMENTS.length);
        for (const c of colours) expect(c).toMatch(/^#[0-9a-f]{6}$/);
        for (const s of SEGMENTS) expect(SEGMENT_SHORT[s].length).toBeLessThan(20);
    });

    test("each segment has its own pictogram on the 24-unit grid", () => {
        const lines = SEGMENTS.map((s) => SEGMENT_PICTO[s].line);
        expect(new Set(lines).size).toBe(SEGMENTS.length);
        for (const s of SEGMENTS) {
            const { line, solid } = SEGMENT_PICTO[s];
            for (const d of [line, solid ?? ""]) {
                const nums = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
                // Absolute coordinates stay on the grid (arc radii included).
                for (const n of nums) expect(Math.abs(n)).toBeLessThanOrEqual(24);
            }
        }
    });

    test("a group's mix lists segments in chain order, named for screen readers", () => {
        const pins = sitePins().filter((p) => p.country === "JP");
        const mix = segmentMix(pins);
        expect(mix.map((m) => m.segment)).toEqual(
            SEGMENTS.filter((s) => pins.some((p) => p.segment === s)),
        );
        expect(mix.reduce((s, m) => s + m.n, 0)).toBe(pins.length);
        expect(
            mixPhrase([
                { segment: "magnets-motors", n: 3 },
                { segment: "gears-screws-bearings", n: 2 },
                { segment: "robot-actuator-oem", n: 1 },
            ]),
        ).toBe(
            "3 magnet and motor sites, 2 gear and bearing sites, 1 robot maker site",
        );
    });

    test("group geometry: overlapping points group, block size fits its tiles", () => {
        const groups = groupPoints(
            [
                { id: "a", at: [0, 0] },
                { id: "b", at: [5, 0] },
                { id: "c", at: [100, 0] },
            ],
            10,
        );
        expect(groups.map((g) => g.ids.sort())).toEqual([["a", "b"], ["c"]]);
        const one: [number, number] = mixSize([{ segment: "magnets-motors", n: 1 }]);
        expect(one).toEqual([16 + 6, 16 + 6]);
        const row = mixSize([
            { segment: "magnets-motors", n: 1 },
            { segment: "robot-actuator-oem", n: 1 },
        ]);
        expect(row).toEqual([16 * 2 + 2 + 6, 22]);
    });

    test("reference cities: one capital per country map, inside its box", () => {
        for (const code of ADMIN1_COUNTRIES) {
            const cities = REFERENCE_CITIES[code];
            expect(cities.filter((c) => c.capital)).toHaveLength(1);
            const [minLat, minLon, maxLat, maxLon] = COUNTRIES[code].bbox;
            for (const c of cities) {
                expect(c.lat).toBeGreaterThanOrEqual(minLat);
                expect(c.lat).toBeLessThanOrEqual(maxLat);
                expect(c.lon).toBeGreaterThanOrEqual(minLon);
                expect(c.lon).toBeLessThanOrEqual(maxLon);
            }
        }
    });

    test("every lab cluster holds at least one site", () => {
        for (const c of LAB_CLUSTERS) {
            const [minLat, minLon, maxLat, maxLon] = c.bbox;
            const inside = SITES.filter(
                (s) =>
                    s.lat >= minLat &&
                    s.lat <= maxLat &&
                    s.lon >= minLon &&
                    s.lon <= maxLon,
            );
            expect(inside.length).toBeGreaterThan(0);
        }
    });
});

describe("flow fixtures", () => {
    test("the lab robot flow adds up to the cited BOM total", () => {
        const { links } = labRobotFlow();
        const into = (id: string) =>
            links.filter((l) => l.target === id).reduce((s, l) => s + l.value, 0);
        expect(into("robot")).toBeCloseTo(4312, 6);
        expect(into("actuators") + into("rest")).toBeCloseTo(4312, 6);
    });

    test("the Nd step multiplier is modeled with its method", () => {
        const nd = labNdStep();
        expect(nd?.multiplier.confidence).toBe("modeled");
        expect(nd?.multiplier.note).toContain("oxide");
        expect(nd?.multiplier.value).toBeCloseTo(
            (nd?.metal.value ?? 0) / (73 * 1.166),
            6,
        );
        expect(auditRegistry().errors).toEqual([]);
    });
});
