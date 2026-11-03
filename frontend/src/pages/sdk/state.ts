import { SDK_DIMENSIONS, SDK_PRESETS, type SdkDimension, type SdkPreset } from "../../../../src/sdk";

// URL state for /sdk: ?preset= picks the weighting, #brand=<id> focuses a
// brand (from badges and the leaderboard), #brand=<id>&dim=<dimension> opens
// one heatmap cell's evidence.

export interface Focus {
    brand: string | null;
    dim: SdkDimension | null;
}

export function readPreset(search = window.location.search): SdkPreset {
    const p = new URLSearchParams(search).get("preset");
    return (SDK_PRESETS as readonly string[]).includes(p ?? "") ? (p as SdkPreset) : "balanced";
}

export function readFocus(hash = window.location.hash): Focus {
    const q = new URLSearchParams(hash.replace(/^#/, ""));
    const dim = q.get("dim");
    return {
        brand: q.get("brand"),
        dim: (SDK_DIMENSIONS as readonly string[]).includes(dim ?? "") ? (dim as SdkDimension) : null,
    };
}

export function writeState(preset: SdkPreset, focus: Focus): void {
    const q = new URLSearchParams(window.location.search);
    if (preset === "balanced") q.delete("preset");
    else q.set("preset", preset);
    const search = q.toString();
    const h = new URLSearchParams();
    if (focus.brand) h.set("brand", focus.brand);
    if (focus.brand && focus.dim) h.set("dim", focus.dim);
    // With no focus, leave a non-SDK fragment (footnote #sc-source-*, a section
    // anchor) in place; only an SDK fragment is cleared.
    const current = window.location.hash.replace(/^#/, "");
    const ours = /^(brand|dim)=/.test(current);
    const hash = focus.brand || ours ? h.toString() : current;
    const url = `${window.location.pathname}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`;
    window.history.replaceState(window.history.state, "", url);
}

// Compare slots: fixed colours so a brand keeps its colour across charts.
export const SLOT_COLORS = ["#c3fffd", "#ff922b", "#b197fc", "#69db7c"] as const;

export const scoreText = (n: number | undefined) => (n === undefined ? "n/a" : String(Math.round(n)));
