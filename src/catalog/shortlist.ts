// Requirement-to-catalog screening shared by the calculators and guides.
// Display-only: it never edits catalog values, and unknown fields stay unknown
// rather than counting as a pass or a zero.

export interface ShortlistActuator {
    id: string;
    name: string;
    brand: string;
    category: string;
    use_cases: readonly string[];
    peak_torque_nm: number | null;
    rated_torque_nm: number | null;
    max_speed_rpm: number | null;
    weight_g: number | null;
    integrated_driver: boolean | null;
}

export interface Requirement {
    // Output-side torque the joint must deliver, N·m.
    torqueNm: number;
    // Output-side speed, rpm. Omitted or 0 means "no speed requirement".
    speedRpm?: number;
    // Restrict to actuators tagged with any of these use cases.
    useCases?: readonly string[];
}

export type TorqueFit = "rated" | "peak";
export type SpeedFit = "meets" | "unknown" | "none";

export interface ShortlistRow<A extends ShortlistActuator = ShortlistActuator> {
    actuator: A;
    // "rated": the documented rated torque covers the requirement.
    // "peak": only the documented peak does (short duty, not continuous).
    torque: TorqueFit;
    // "meets": documented max speed reaches the requirement; "unknown": not
    // documented; "none": no speed requirement was given.
    speed: SpeedFit;
}

export interface Shortlist<A extends ShortlistActuator = ShortlistActuator> {
    rows: ShortlistRow<A>[];
    // Every catalog entry that passes, before the display limit.
    total: number;
    // How many of those passed without a documented max speed.
    unknownSpeed: number;
}

function torqueFit(a: ShortlistActuator, need: number): TorqueFit | null {
    if (a.rated_torque_nm != null && a.rated_torque_nm >= need) return "rated";
    if (a.peak_torque_nm != null && a.peak_torque_nm >= need) return "peak";
    return null;
}

function speedFit(a: ShortlistActuator, need: number | undefined): SpeedFit | null {
    if (!need) return "none";
    if (a.max_speed_rpm == null) return "unknown";
    return a.max_speed_rpm >= need ? "meets" : null;
}

const RANK: Record<TorqueFit, number> = { rated: 0, peak: 1 };
const SPEED_RANK: Record<SpeedFit, number> = { meets: 0, none: 0, unknown: 1 };

// Rated fits first, documented speed before unknown speed, then lightest.
// Missing mass sorts last; ties fall back to the smaller sufficient torque so
// a 2 kN·m reducer never outranks a joint sized for the job.
// The torque that earned the fit: rated for rated fits, peak for peak-only.
function fitTorque(r: ShortlistRow<ShortlistActuator>): number {
    return (
        (r.torque === "rated"
            ? r.actuator.rated_torque_nm
            : r.actuator.peak_torque_nm) ?? 0
    );
}

export function shortlist<A extends ShortlistActuator>(
    catalog: readonly A[],
    req: Requirement,
    limit = 6,
): Shortlist<A> {
    if (!(req.torqueNm > 0) || !Number.isFinite(req.torqueNm)) {
        return { rows: [], total: 0, unknownSpeed: 0 };
    }
    const uses = req.useCases?.length ? new Set(req.useCases) : null;
    const rows: ShortlistRow<A>[] = [];
    for (const actuator of catalog) {
        if (uses && !actuator.use_cases.some((u) => uses.has(u))) continue;
        const torque = torqueFit(actuator, req.torqueNm);
        const speed = speedFit(actuator, req.speedRpm);
        if (torque && speed) rows.push({ actuator, torque, speed });
    }
    rows.sort(
        (a, b) =>
            RANK[a.torque] - RANK[b.torque] ||
            SPEED_RANK[a.speed] - SPEED_RANK[b.speed] ||
            (a.actuator.weight_g ?? Number.POSITIVE_INFINITY) -
                (b.actuator.weight_g ?? Number.POSITIVE_INFINITY) ||
            fitTorque(a) - fitTorque(b) ||
            a.actuator.id.localeCompare(b.actuator.id),
    );
    return {
        rows: rows.slice(0, limit),
        total: rows.length,
        unknownSpeed: rows.filter((r) => r.speed === "unknown").length,
    };
}

export const TORQUE_FIT_LABEL: Record<TorqueFit, string> = {
    rated: "Rated torque covers it",
    peak: "Peak only: short duty",
};

export const SPEED_FIT_LABEL: Record<SpeedFit, string> = {
    meets: "Max speed documented",
    unknown: "Speed not documented",
    none: "",
};

// A part sold without drive electronics needs a separate driver (and, for a
// bare reducer, a motor). Say so next to any shortlist entry.
export function integrationNote(a: ShortlistActuator): string | null {
    return a.integrated_driver === false ? "Drive electronics not included" : null;
}

// Serializable shortlist rows for agent surfaces (MCP, WebMCP). Paths are
// site-relative; callers add the host where they need absolute URLs.
export function candidateRows(list: Shortlist) {
    return list.rows.map(({ actuator: a, torque }) => ({
        id: a.id,
        name: a.name,
        brand: a.brand,
        rated_torque_nm: a.rated_torque_nm,
        peak_torque_nm: a.peak_torque_nm,
        weight_g: a.weight_g,
        fit: torque,
        fit_label: TORQUE_FIT_LABEL[torque],
        note: integrationNote(a),
        page_path: `/actuators/${encodeURIComponent(a.id)}`,
    }));
}
