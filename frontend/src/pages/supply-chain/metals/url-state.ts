import { GRADE_IDS, type GradeId } from "../../../../../src/supply-chain/metals/grades";
import { METAL_IDS, type MetalId } from "../../../../../src/supply-chain/metals/elements";
import { METAL_STAGES, type MetalStage } from "../../../../../src/supply-chain/metals/stage-shares";

// /metals keeps its picks in the URL so a view can be linked:
// ?element=dy&stage=separation&chain=1&grade=uh

export interface MetalsState {
    element: MetalId;
    stage: MetalStage;
    // All four stages stacked instead of one.
    chain: boolean;
    grade: GradeId;
}

export const DEFAULT_STATE: MetalsState = { element: "nd", stage: "mining", chain: false, grade: "sh" };

const pick = <T extends string>(all: readonly T[], v: string | null, fallback: T): T =>
    (all as readonly string[]).includes(v ?? "") ? (v as T) : fallback;

export function readState(search: string): MetalsState {
    const q = new URLSearchParams(search);
    return {
        element: pick(METAL_IDS, q.get("element")?.toLowerCase() ?? null, DEFAULT_STATE.element),
        stage: pick(METAL_STAGES, q.get("stage"), DEFAULT_STATE.stage),
        chain: q.get("chain") === "1",
        grade: pick(GRADE_IDS, q.get("grade")?.toLowerCase() ?? null, DEFAULT_STATE.grade),
    };
}

// Defaults stay out of the URL; unrelated params are kept.
export function writeState(search: string, s: MetalsState): string {
    const q = new URLSearchParams(search);
    for (const key of ["element", "stage", "chain", "grade"]) q.delete(key);
    const set = (key: string, value: string, fallback: string) => {
        if (value !== fallback) q.set(key, value);
    };
    set("element", s.element, DEFAULT_STATE.element);
    set("stage", s.stage, DEFAULT_STATE.stage);
    set("chain", s.chain ? "1" : "0", "0");
    set("grade", s.grade, DEFAULT_STATE.grade);
    const out = q.toString();
    return out ? `?${out}` : "";
}
