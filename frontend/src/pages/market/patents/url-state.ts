import { TECHNOLOGY_IDS } from "../../../../../src/patents/technologies";

// /patents keeps its picks in the URL: ?tech=ndfeb&stack=technology&q=tdk

export type Stack = "country" | "technology";

export interface PatentsState {
    tech: string;
    stack: Stack;
    q: string;
}

export const DEFAULT_STATE: PatentsState = { tech: "robot-joints", stack: "country", q: "" };

export function readState(search: string): PatentsState {
    const q = new URLSearchParams(search);
    const tech = q.get("tech") ?? "";
    return {
        tech: TECHNOLOGY_IDS.includes(tech) ? tech : DEFAULT_STATE.tech,
        stack: q.get("stack") === "technology" ? "technology" : "country",
        q: q.get("q") ?? "",
    };
}

// Defaults stay out of the URL; unrelated params are kept.
export function writeState(search: string, s: PatentsState): string {
    const q = new URLSearchParams(search);
    for (const key of ["tech", "stack", "q"]) q.delete(key);
    if (s.tech !== DEFAULT_STATE.tech) q.set("tech", s.tech);
    if (s.stack !== DEFAULT_STATE.stack) q.set("stack", s.stack);
    if (s.q.trim()) q.set("q", s.q.trim());
    const out = q.toString();
    return out ? `?${out}` : "";
}
