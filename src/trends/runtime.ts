import { ROBOTS } from "../catalog";
import type { TrendChart, TrendPoint } from "./types";

// Battery runtime per charge of legged humanoids, by launch month. Runtimes
// for robots on /robots are read from the catalog at runtime; launch months
// are the maker's announcement and are flagged estimated unless a dated
// source gives them.

interface Launch {
    robotId: string;
    date: string;
    // A dated source for the launch, when we have one.
    dated?: string;
}

const LAUNCHES: Launch[] = [
    { robotId: "unitree-g1", date: "2024-05" },
    { robotId: "booster-t1", date: "2024-10" },
    { robotId: "unitree-r1", date: "2025-07" },
    { robotId: "fourier-gr-3", date: "2025-08", dated: "prn-fourier-gr3" },
    { robotId: "booster-k1", date: "2025-09" },
    { robotId: "unitree-h2", date: "2025-10" },
    { robotId: "1x-neo", date: "2025-10" },
    { robotId: "agility-digit-5", date: "2026-03" },
];

// Empty when the robot has no published runtime on /robots.
function catalogRuntime(l: Launch): TrendPoint[] {
    const r = ROBOTS.find((x) => x.id === l.robotId);
    if (!r || r.runtime_h == null) return [];
    const point: TrendPoint = {
        date: l.date,
        value: r.runtime_h,
        label: `${r.brand.split(" ")[0]} ${r.name}`,
        sources: [`robots:${l.robotId}`, ...(l.dated ? [l.dated] : [])],
        confidence: l.dated ? "reported" : "estimated",
    };
    return [point];
}

const H1: TrendPoint = {
    date: "2023-08",
    value: 2,
    label: "Unitree H1",
    sources: ["robohub-h1-runtime"],
    confidence: "estimated",
};

export const RUNTIME_CHART: TrendChart = {
    id: "battery-runtime",
    section: "misc",
    title: "Humanoid battery runtime",
    question: "Are humanoids running longer per charge?",
    unit: "hours per charge",
    kind: "scatter",
    series: [
        {
            id: "humanoids",
            label: "Humanoid robots",
            points: [H1, ...LAUNCHES.flatMap(catalogRuntime)].sort((a, b) =>
                a.date.localeCompare(b.date),
            ),
        },
    ],
    notes: [
        "Maker-quoted runtime per charge; makers mix walking, standing and mixed-use figures, and some robots hot-swap packs. Points are flagged estimated where the launch month is the announcement date without a dated source.",
        "No clear upward trend yet: newer models spread widely, set more by pack size and use than by launch year.",
    ],
    licence: "CC BY 4.0 (actuatorlist /robots), plus facts from maker pages and press.",
};
