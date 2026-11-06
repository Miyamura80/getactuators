import { getAltTech } from "../../../../../src/supply-chain/alts";
import { BASELINE_ID } from "./landscape-model";

// /alts keeps the focused technology in the query (/alts?tech=hasel), so a
// link opens its card. ?tech=ndfeb opens the NdFeB reference card. No tech,
// no query.

export interface AltsState {
    tech: string | null;
}

export function readState(search: string): AltsState {
    const tech = new URLSearchParams(search).get("tech");
    return { tech: tech && (tech === BASELINE_ID || getAltTech(tech)) ? tech : null };
}

export function writeState(search: string, s: AltsState): string {
    const q = new URLSearchParams(search);
    q.delete("group");
    if (s.tech) q.set("tech", s.tech);
    else q.delete("tech");
    const out = q.toString();
    return out ? `?${out}` : "";
}
