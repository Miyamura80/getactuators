import { countryName } from "../../country-flag";
import { getCompany } from "../registry";
import {
    type AltFamily,
    type AltTech,
    COMPANY_TYPE_LABEL,
    type CompanyType,
    END_MARKET_LABEL,
    type EndMarket,
    FAMILY_LABEL,
    type MarketSlice,
} from "./types";

// Regrouping the market tiles for the /alts treemap. Grouping by family or
// end market moves each tile whole; grouping by company type or country
// splits a tile evenly across the types or home countries of the companies
// we list for its technologies, which is our model, not a measured split.

export const GROUPINGS = ["family", "company-type", "end-market", "country"] as const;
export type Grouping = (typeof GROUPINGS)[number];

export const GROUPING_LABEL: Record<Grouping, string> = {
    family: "Family",
    "company-type": "Company type",
    "end-market": "End market",
    country: "Country",
};

export const UNATTRIBUTED = "unattributed";

export interface TreemapLeaf {
    // Stable across groupings for one slice and group: "<slice>:<group>".
    id: string;
    sliceId: string;
    group: string;
    value: number;
    // Share of the slice in this leaf (1 when the tile moves whole).
    share: number;
}

export interface TreemapGroup {
    id: string;
    label: string;
    value: number;
    leaves: TreemapLeaf[];
}

function familyOf(
    slice: MarketSlice,
    techs: readonly AltTech[],
): AltFamily | undefined {
    return techs.find((t) => t.id === slice.techIds[0])?.family;
}

function playersOf(slice: MarketSlice, techs: readonly AltTech[]) {
    return techs.filter((t) => slice.techIds.includes(t.id)).flatMap((t) => t.players);
}

// The groups one slice falls in under a grouping, before splitting.
export function groupsOf(
    slice: MarketSlice,
    by: Grouping,
    techs: readonly AltTech[],
): string[] {
    if (by === "family") return [familyOf(slice, techs) ?? UNATTRIBUTED];
    if (by === "end-market") return [slice.endMarket];
    const players = playersOf(slice, techs);
    const keys =
        by === "company-type"
            ? players.map((p) => p.companyType)
            : players
                  .map((p) => getCompany(p.companyId)?.hqCountry)
                  .filter((c): c is NonNullable<typeof c> => !!c);
    const distinct = [...new Set<string>(keys)].sort();
    return distinct.length ? distinct : [UNATTRIBUTED];
}

export function groupLabel(by: Grouping, id: string): string {
    if (id === UNATTRIBUTED) return "No company listed";
    if (by === "family") return FAMILY_LABEL[id as AltFamily] ?? id;
    if (by === "company-type") return COMPANY_TYPE_LABEL[id as CompanyType] ?? id;
    if (by === "end-market") return END_MARKET_LABEL[id as EndMarket] ?? id;
    return countryName(id);
}

// Leaves grouped for the treemap, largest group first.
export function groupSlices(
    slices: readonly MarketSlice[],
    by: Grouping,
    techs: readonly AltTech[],
): TreemapGroup[] {
    const groups = new Map<string, TreemapLeaf[]>();
    for (const s of slices) {
        const keys = groupsOf(s, by, techs);
        for (const g of keys) {
            const leaf: TreemapLeaf = {
                id: `${s.id}:${g}`,
                sliceId: s.id,
                group: g,
                value: s.revenueUsd.value / keys.length,
                share: 1 / keys.length,
            };
            groups.set(g, [...(groups.get(g) ?? []), leaf]);
        }
    }
    return [...groups]
        .map(([id, leaves]) => ({
            id,
            label: groupLabel(by, id),
            value: leaves.reduce((a, l) => a + l.value, 0),
            leaves: [...leaves].sort((a, b) => b.value - a.value),
        }))
        .sort((a, b) => b.value - a.value);
}

export function isGrouping(x: string | null | undefined): x is Grouping {
    return (GROUPINGS as readonly string[]).includes(x ?? "");
}
