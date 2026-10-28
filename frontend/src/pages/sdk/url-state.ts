import { PRESETS } from "../../../../src/sdk/rubric";
import { DIMENSION_IDS, type DimensionId } from "../../../../src/sdk/types";

// /sdk keeps its view in the URL so it can be linked:
// ?preset=ros2&brand=mjbots&dim=ros_sim&compare=mjbots,odrive,robotis

export interface SdkState {
    preset: string;
    // Brand whose themes and evidence are shown; also opens the drill-down.
    brand: string | null;
    // Dimension of the open heatmap cell (with brand), or null.
    dim: DimensionId | null;
    // Radar compare set, 1 to 4 brand ids.
    compare: string[];
}

export const MAX_COMPARE = 4;

export function readState(search: string, brands: readonly string[], fallback: string[]): SdkState {
    const q = new URLSearchParams(search);
    const preset = PRESETS.some((p) => p.id === q.get("preset")) ? (q.get("preset") as string) : "balanced";
    const brand = brands.includes(q.get("brand") ?? "") ? q.get("brand") : null;
    const dimRaw = q.get("dim") as DimensionId | null;
    const dim = brand && dimRaw && DIMENSION_IDS.includes(dimRaw) ? dimRaw : null;
    const picked = (q.get("compare") ?? "").split(",").filter((b) => brands.includes(b));
    const compare = [...new Set(picked)].slice(0, MAX_COMPARE);
    return { preset, brand, dim, compare: compare.length ? compare : fallback };
}

// Defaults stay out of the URL; unrelated params are kept.
export function writeState(search: string, s: SdkState, fallback: string[]): string {
    const q = new URLSearchParams(search);
    for (const key of ["preset", "brand", "dim", "compare"]) q.delete(key);
    if (s.preset !== "balanced") q.set("preset", s.preset);
    if (s.brand) q.set("brand", s.brand);
    if (s.brand && s.dim) q.set("dim", s.dim);
    if (s.compare.join(",") !== fallback.join(",")) q.set("compare", s.compare.join(","));
    const out = q.toString();
    return out ? `?${out.replaceAll("%2C", ",")}` : "";
}
