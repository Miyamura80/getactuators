import type { SourceId } from "../sourced";
import type { MetalId } from "./elements";

// Events that moved magnet-metal prices or control, each checked against the
// cited source. Dates are as precise as the source allows (YYYY, YYYY-MM or
// YYYY-MM-DD). The chart pins each one on the price history.

export type EventKind = "policy" | "supply" | "market" | "floor";

export interface MetalEvent {
    id: string;
    date: string;
    title: string;
    detail: string;
    kind: EventKind;
    elements: MetalId[];
    sources: SourceId[];
}

const MAGNET: MetalId[] = ["nd", "pr", "dy", "tb"];

export const METAL_EVENTS: MetalEvent[] = [
    {
        id: "japan-slowdown-2010",
        date: "2010-09",
        title: "China slows exports to Japan",
        detail: "After a boat collision near the Senkaku/Diaoyu islands, China sharply slowed rare earth exports to Japan, then the largest importer, for about two months.",
        kind: "policy",
        elements: MAGNET,
        sources: ["nus-eai-rare-earths-2025"],
    },
    {
        id: "bubble-2011",
        date: "2011",
        title: "Price bubble peaks",
        detail: "Dysprosium metal for export reached $3,410/kg in 2011, about 120 times its 2003 low; China's domestic price peaked about 22% lower.",
        kind: "market",
        elements: ["dy", "tb", "nd"],
        sources: ["arnold-dysprosium-2015"],
    },
    {
        id: "slide-2012",
        date: "2012",
        title: "Prices fall back",
        detail: "Neodymium oxide began 2012 at $195/kg and ended it at $80/kg as weak demand and more efficient use cut consumption.",
        kind: "market",
        elements: ["nd"],
        sources: ["usgs-mcs-2013-ree"],
    },
    {
        id: "wto-2014",
        date: "2014",
        title: "WTO rules against China",
        detail: "The US, EU and Japan brought China's rare earth export curbs to the WTO in 2012; the 2014 ruling found they broke China's commitments.",
        kind: "policy",
        elements: MAGNET,
        sources: ["nus-eai-rare-earths-2025"],
    },
    {
        id: "quotas-end-2015",
        date: "2015",
        title: "Export quotas end",
        detail: "China ended rare earth export quotas, removed export tariffs and moved to a resource tax on sales value; its mining quota stayed at 105,000 t.",
        kind: "policy",
        elements: MAGNET,
        sources: ["usgs-mcs-2016-ree"],
    },
    {
        id: "crg-2021",
        date: "2021-12",
        title: "China Rare Earth Group formed",
        detail: "Three of the six state groups merged into China Rare Earth Group, leaving it and China Northern Rare Earth to run the sector.",
        kind: "market",
        elements: MAGNET,
        sources: ["chinadaily-crg-2021", "nus-eai-rare-earths-2025"],
    },
    {
        id: "tech-ban-2023",
        date: "2023-12-21",
        title: "Processing technology export ban",
        detail: "China banned exporting technology to extract and separate rare earths, to make rare earth metals and alloys, and to prepare some rare earth magnets.",
        kind: "policy",
        elements: MAGNET,
        sources: ["af-china-tech-ban-2023"],
    },
    {
        id: "licensing-2025-04",
        date: "2025-04",
        title: "Licences for Sm, Dy, Tb and four more",
        detail: "China added export licensing for samarium, gadolinium, terbium, dysprosium, lutetium, scandium and yttrium. These controls remain in force.",
        kind: "policy",
        elements: ["dy", "tb", "sm"],
        sources: ["usgs-mcs-2026-ree", "nus-eai-rare-earths-2025"],
    },
    {
        id: "dod-floor-2025",
        date: "2025-07-10",
        title: "US floor under NdPr",
        detail: "The US Department of Defense set a 10-year price floor of $110/kg for MP Materials' NdPr and agreed to buy all magnets from a new plant.",
        kind: "floor",
        elements: ["nd", "pr"],
        sources: ["mp-dod-partnership-2025"],
    },
    {
        id: "controls-2025-10",
        date: "2025-10",
        title: "Controls widened, then paused",
        detail: "China extended export controls to all heavy rare earths in October 2025 and suspended that expansion for one year in November, to 10 November 2026. The April 2025 controls stay. As of early October 2026 no extension of the pause had been announced.",
        kind: "policy",
        elements: ["dy", "tb"],
        sources: ["usgs-mcs-2026-ree-heavy", "rem-dy-price-2026"],
    },
    {
        id: "rally-2026",
        date: "2026-03",
        title: "2026 rally",
        detail: "Neodymium metal in China roughly doubled from about $58/kg in January to $117/kg by 1 March 2026.",
        kind: "market",
        elements: ["nd", "pr"],
        sources: ["rem-nd-price-2026"],
    },
];
