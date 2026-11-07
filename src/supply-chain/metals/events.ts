import { POLICY_MEASURES } from "../policy";
import type { SourceId } from "../sourced";
import type { MetalId } from "./elements";

// Events that moved magnet-metal prices or control, each checked against the
// cited source. Dates are as precise as the source allows (YYYY, YYYY-MM or
// YYYY-MM-DD). The chart pins each one on the price history.
//
// Government measures (export controls, the US price floor) live in the
// /policy dataset and are pinned here from it; this file keeps only market
// and supply events and the policy moments that were not a formal measure.

export type EventKind = "policy" | "supply" | "market" | "floor";

export interface MetalEvent {
    id: string;
    // The /policy measure behind a pinned policy event.
    measureId?: string;
    date: string;
    title: string;
    detail: string;
    kind: EventKind;
    elements: MetalId[];
    sources: SourceId[];
}

const MAGNET: MetalId[] = ["nd", "pr", "dy", "tb"];

const MARKET_EVENTS: MetalEvent[] = [
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
        id: "crg-2021",
        date: "2021-12",
        title: "China Rare Earth Group formed",
        detail: "Three of the six state groups merged into China Rare Earth Group, leaving it and China Northern Rare Earth to run the sector.",
        kind: "market",
        elements: MAGNET,
        sources: ["chinadaily-crg-2021", "nus-eai-rare-earths-2025"],
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

const POLICY_EVENTS: MetalEvent[] = POLICY_MEASURES.flatMap((m) =>
    m.metals
        ? [
              {
                  id: m.metals.eventId,
                  measureId: m.id,
                  date: m.metals.date ?? m.statusHistory.at(-1)?.date ?? "",
                  title: m.metals.title,
                  detail: m.summary,
                  kind: m.metals.kind,
                  elements: m.metals.elements,
                  sources: m.sources,
              },
          ]
        : [],
);

export const METAL_EVENTS: MetalEvent[] = [...MARKET_EVENTS, ...POLICY_EVENTS].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
);
