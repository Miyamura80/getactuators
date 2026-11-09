import { describe, expect, test } from "bun:test";
import { ACTUATORS, ROBOTS } from "@/catalog";
import { DRIVE_STEPS } from "@/supply-chain/processes/precision-drive-steps";
import {
    SOURCES,
    TREND_CHARTS,
    TREND_SECTIONS,
    allPoints,
    chartsIn,
    getTrendChart,
    isEstimatedSeries,
    isOwnSource,
    perNm,
    yearOf,
} from "@/trends";
import { trendsLicenceErrors } from "@/trends/licence";

const DATE = /^(19|20)\d\d(-(0[1-9]|1[0-2]))?$/;

describe("/trends registry", () => {
    test("chart ids are unique and every section has a chart", () => {
        const ids = TREND_CHARTS.map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const s of TREND_SECTIONS) expect(chartsIn(s).length).toBeGreaterThan(0);
    });

    test("every chart has a unit, a licence line, notes and points", () => {
        for (const c of TREND_CHARTS) {
            expect(c.unit.trim().length).toBeGreaterThan(0);
            expect(c.licence.trim().length).toBeGreaterThan(0);
            expect(c.notes.length).toBeGreaterThan(0);
            expect(allPoints(c).length).toBeGreaterThan(0);
        }
    });

    test("every point is cited with a known source and a confidence", () => {
        for (const c of TREND_CHARTS)
            for (const p of allPoints(c)) {
                expect(p.sources.length).toBeGreaterThan(0);
                for (const id of p.sources)
                    expect(isOwnSource(id) || Object.hasOwn(SOURCES, id)).toBe(true);
                expect(["reported", "estimated", "modeled"]).toContain(p.confidence);
                expect(Number.isFinite(p.value)).toBe(true);
            }
    });

    test("dates are well formed and ordered within each series", () => {
        for (const c of TREND_CHARTS)
            for (const s of c.series) {
                for (const p of s.points) expect(p.date).toMatch(DATE);
                const xs = s.points.map((p) => yearOf(p.date));
                expect(xs).toEqual([...xs].sort((a, b) => a - b));
            }
    });

    test("ranges bracket their value", () => {
        for (const c of TREND_CHARTS)
            for (const p of allPoints(c))
                if (p.range) {
                    expect(p.range[0]).toBeLessThanOrEqual(p.value);
                    expect(p.range[1]).toBeGreaterThanOrEqual(p.value);
                }
    });

    test("the citation and licence audit passes", () => {
        expect(trendsLicenceErrors()).toEqual([]);
    });

    test("the audit rejects points dated after the audit day", () => {
        expect(
            trendsLicenceErrors("2025-06-30").some((e) =>
                e.includes("dated after 2025-06-30"),
            ),
        ).toBe(true);
    });

    test("a series is flagged estimated exactly when no point is reported", () => {
        const csf = getTrendChart("rated-life")?.series.find((s) => s.id === "hd-csf");
        expect(csf && isEstimatedSeries(csf)).toBe(true);
        const xm430 = getTrendChart("actuator-prices")?.series[0];
        expect(xm430 && isEstimatedSeries(xm430)).toBe(false);
    });

    test("Epoch and Tadepalli figures are facts, linked to the originals", () => {
        for (const id of ["price-of-ai", "price-per-rd"]) {
            const c = getTrendChart(id);
            expect(c?.original?.url).toMatch(/^https:\/\//);
        }
        expect(SOURCES["epoch-plunging-price"].reuse).toBe("facts");
        expect(SOURCES["tadepalli-rd-price"].reuse).toBe("facts");
    });
});

describe("/trends reuses actuatorlist data", () => {
    test("each price series ends on the catalog's current price and torque", () => {
        const c = getTrendChart("actuator-prices");
        expect(c).toBeDefined();
        for (const s of c?.series ?? []) {
            const last = s.points.at(-1);
            const a = ACTUATORS.find((x) => x.id === s.actuatorId);
            expect(last?.sources).toEqual([`catalog:${s.actuatorId}`]);
            expect(last?.value).toBe(a?.price_usd as number);
            expect(last?.torqueNm).toBe(a?.peak_torque_nm as number);
            for (const p of s.points) expect(perNm(p)).toBeGreaterThan(0);
        }
    });

    test("runtimes match /robots", () => {
        const c = getTrendChart("battery-runtime");
        expect(allPoints(c ?? TREND_CHARTS[0]!).length).toBe(9);
        for (const p of allPoints(c ?? TREND_CHARTS[0]!)) {
            const id = p.sources
                .find((x) => x.startsWith("robots:"))
                ?.slice("robots:".length);
            if (!id) continue;
            expect(p.value).toBe(ROBOTS.find((r) => r.id === id)?.runtime_h as number);
        }
    });

    test("the 2026 roller screw prices match /manufacturing", () => {
        const step = DRIVE_STEPS.find((s) => s.id === "roller-screw-assembly");
        const china = step?.keyNumbers.find((k) => k.label === "China price")?.value;
        const swiss = step?.keyNumbers.find((k) => k.label === "Swiss price")?.value;
        const c = getTrendChart("roller-screw-cost");
        const chinaPoint = c?.series.find((s) => s.id === "china-mass")?.points.at(-1);
        const swissPoint = c?.series.find((s) => s.id === "swiss")?.points[0];
        expect(china?.value).toBe(499);
        expect(chinaPoint?.value).toBe(Math.round(499 / 7.1));
        expect(swissPoint?.range).toEqual(swiss?.range as readonly [number, number]);
    });
});
