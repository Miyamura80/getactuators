import { ACTUATORS } from "../catalog";
import type { TrendChart, TrendPoint, TrendSeries } from "./types";

// Dated list prices for catalog actuators. Past points come from archived
// vendor and retailer pages and papers; the last point of each series is the
// catalog's current price, read at runtime so it never drifts from
// /actuators. This is a curated sample: the weekly snapshot pipeline and
// Wayback back-fill for the whole catalog belong to /prices (issue #95).

// Month the catalog prices were last checked.
export const CATALOG_PRICE_DATE = "2026-11";

// Empty when the catalog has no price or torque for it (tests/trends checks
// every series ends on one).
function catalogPoint(id: string): TrendPoint[] {
    const a = ACTUATORS.find((x) => x.id === id);
    if (!a || a.price_usd == null || a.peak_torque_nm == null) return [];
    const point: TrendPoint = {
        date: CATALOG_PRICE_DATE,
        value: a.price_usd,
        torqueNm: a.peak_torque_nm,
        sources: [`catalog:${id}`],
        confidence: "reported",
        note: "Current catalog price.",
    };
    return [point];
}

interface PriceSeriesInput {
    actuatorId: string;
    label: string;
    // Peak torque for past points unless a point overrides it.
    torqueNm: number;
    past: TrendPoint[];
    note?: string;
}

function priceSeries(s: PriceSeriesInput): TrendSeries {
    return {
        id: s.actuatorId,
        label: s.label,
        actuatorId: s.actuatorId,
        points: [
            ...s.past.map((p) => ({ ...p, torqueNm: p.torqueNm ?? s.torqueNm })),
            ...catalogPoint(s.actuatorId),
        ],
        ...(s.note ? { note: s.note } : {}),
    };
}

const r = (
    date: string,
    value: number,
    sources: string[],
    note?: string,
): TrendPoint => ({
    date,
    value,
    sources,
    confidence: "reported",
    ...(note ? { note } : {}),
});

export const PRICE_SERIES: TrendSeries[] = [
    priceSeries({
        actuatorId: "dynamixel-xm430-w350-t",
        label: "Dynamixel XM430-W350-T",
        torqueNm: 4.1,
        past: [
            r("2017-12", 229.9, ["wb-xm430-2017"]),
            r("2020-09", 229.9, ["wb-xm430-2020"]),
            r("2024-02", 269.9, ["wb-xm430-2024"]),
        ],
    }),
    priceSeries({
        actuatorId: "cubemars-ak80-9",
        label: "CubeMars AK80-9",
        torqueNm: 18,
        note: "Earlier points are the first AK80-9 (18 N·m peak) with its driver; the catalog prices the V3.0 (22 N·m).",
        past: [
            r("2021-10", 580, ["arxiv-2110-01562", "cubemars-ak80-9-v1"]),
            r(
                "2024-10",
                579.9,
                ["wb-ak80-9-2024", "cubemars-ak80-9-v1"],
                "With driver board; $479.90 bare.",
            ),
        ],
    }),
    priceSeries({
        actuatorId: "mjbots-qdd100",
        label: "mjbots qdd100",
        torqueNm: 16,
        note: "The catalog figure is the regular price on the product page while the beta unit is out of stock (MOQ 50), not a price seen in a snapshot.",
        past: [
            r("2022-08", 539, ["wb-qdd100-2022"]),
            r(
                "2025-01",
                539,
                ["wb-qdd100-2025"],
                "Single-unit price; 100+ units $479.",
            ),
        ],
    }),
    priceSeries({
        actuatorId: "unitree-go-m8010-6",
        label: "Unitree GO-M8010-6",
        torqueNm: 23.7,
        past: [r("2024-01", 500, ["wb-go-m8010-2024"])],
    }),
    priceSeries({
        actuatorId: "xiaomi-cybergear",
        label: "Xiaomi CyberGear",
        torqueNm: 12,
        note: "Past points are AliExpress prices; the catalog price is a European retailer's, so the rise is partly a change of seller.",
        past: [
            r("2023-09", 88, ["simplefoc-cybergear-2023"], "AliExpress."),
            r("2025-03", 91, ["hackaday-gim6010-cybergear-2025"], "AliExpress."),
        ],
    }),
    priceSeries({
        actuatorId: "steadywin-gim6010-8",
        label: "Steadywin GIM6010-8",
        torqueNm: 11,
        past: [
            {
                date: "2025-03",
                value: 85,
                range: [50, 85],
                sources: ["hackaday-gim6010-cybergear-2025"],
                confidence: "reported",
                note: "AliExpress; $50 bare, up to $85 with the driver board.",
            },
        ],
    }),
    priceSeries({
        actuatorId: "robstride-04",
        label: "RobStride 04",
        torqueNm: 120,
        past: [r("2026-06", 255, ["wb-robstride-04-2026"], "First archived snapshot.")],
    }),
];

export const ACTUATOR_PRICE_CHART: TrendChart = {
    id: "actuator-prices",
    section: "actuators",
    title: "Actuator list prices",
    question: "Are the actuators builders buy getting cheaper?",
    unit: "USD",
    kind: "line",
    log: true,
    series: PRICE_SERIES,
    notes: [
        "Single-unit list prices in US dollars, not inflation-adjusted. Each point is a dated vendor or retailer page (mostly Wayback Machine snapshots); the last point is today's catalog price.",
        "Most main-page leaderboard picks (RobStride, Damiao, MyActuator) launched in 2024 or later and have one or no archived price yet, so their history starts short.",
        "$/N·m divides by peak torque of the unit priced at that date.",
    ],
    licence:
        "Facts from vendor pages, Wayback snapshots, a paper and forum posts; catalog points CC BY 4.0 (actuatorlist).",
};

// $/N·m view of a price series, for the toggle and the markdown twin.
export function perNm(p: TrendPoint): number | null {
    return p.torqueNm ? p.value / p.torqueNm : null;
}
