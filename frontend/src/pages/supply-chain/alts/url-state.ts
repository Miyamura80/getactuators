import { getAltTech } from "../../../../../src/supply-chain/alts";
import { type Grouping, isGrouping } from "../../../../../src/supply-chain/alts/treemap";

// /alts keeps the treemap grouping and the selected technology in the query:
// /alts?group=country&tech=hasel. Defaults stay out of the URL.

export interface AltsState {
    group: Grouping;
    tech: string | null;
}

export const DEFAULT_GROUP: Grouping = "family";

export function readState(search: string): AltsState {
    const q = new URLSearchParams(search);
    const group = q.get("group");
    const tech = q.get("tech");
    return {
        group: isGrouping(group) ? group : DEFAULT_GROUP,
        tech: tech && getAltTech(tech) ? tech : null,
    };
}

export function writeState(search: string, s: AltsState): string {
    const q = new URLSearchParams(search);
    if (s.group === DEFAULT_GROUP) q.delete("group");
    else q.set("group", s.group);
    if (s.tech) q.set("tech", s.tech);
    else q.delete("tech");
    const out = q.toString();
    return out ? `?${out}` : "";
}
