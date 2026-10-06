import { ACTUATORS } from "../lib/data";
import type { Actuator } from "../types";
import { compareHref } from "../lib/compare-selection";
import { fmt } from "../lib/motor-torque";
import { DriverGlyph, FitGauge, SpeedGlyph } from "./FitGauge";
import {
    SPEED_FIT_LABEL,
    TORQUE_FIT_LABEL,
    integrationNote,
    shortlist,
} from "../../../src/catalog/shortlist";

// Torque matches and how many leave speed undocumented; the sort order and
// caveats live in the key.
function summary(total: number, unknownSpeed: number, torqueNm: number, speedRpm?: number): string {
    const head = `${total} ${total === 1 ? "entry covers" : "entries cover"} ${fmt(torqueNm)} N·m`;
    if (!speedRpm || !unknownSpeed) return `${head}${speedRpm ? ` at ${fmt(speedRpm)} rpm` : ""}.`;
    return `${head}; ${unknownSpeed} of them do not document speed.`;
}

// What the gauge and glyphs mean, open by click, tap or keyboard (the
// tooltips are a shortcut, not the only path).
function ShortlistKey({ speed }: { speed: boolean }) {
    return (
        <details className="req-key">
            <summary>
                <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden="true">
                    <circle cx="8" cy="8" r="6.5" />
                    <path d="M8 7v4.5M8 4.6v.1" />
                </svg>
                Key
            </summary>
            <dl>
                <div>
                    <dt><FitGauge need={4} rated={6} peak={12} /></dt>
                    <dd>Bar: rated torque. Hatch: peak. Tick: your requirement. Tick on the bar: continuous fit.</dd>
                </div>
                <div>
                    <dt><FitGauge need={9} rated={6} peak={12} /></dt>
                    <dd>Tick on the hatch: peak only, short duty.</dd>
                </div>
                {speed && (
                    <div>
                        <dt><SpeedGlyph known /> <SpeedGlyph known={false} /></dt>
                        <dd>Max speed documented and fast enough, or not documented.</dd>
                    </div>
                )}
                <div>
                    <dt><DriverGlyph /></dt>
                    <dd>Drive electronics not included.</dd>
                </div>
            </dl>
            <p>
                Order: rated fits, {speed ? "then documented speed, " : ""}then lightest. n/d means not documented, not
                zero. A catalog rating is not a torque–speed envelope: confirm the operating point and duty cycle on the
                datasheet.
            </p>
        </details>
    );
}

// The handoff from a computed requirement into the catalog: which documented
// actuators reach it, how (rated vs peak), and what remains unknown.
export function RequirementShortlist({
    torqueNm,
    speedRpm,
    heading,
    limit = 6,
    onUse,
}: {
    torqueNm: number;
    speedRpm?: number;
    heading: string;
    limit?: number;
    // Offer a per-row action, e.g. feed this actuator's mass back into a model.
    onUse?: { label: (a: Actuator) => string; act: (a: Actuator) => void };
}) {
    const list = shortlist(ACTUATORS, { torqueNm, speedRpm }, limit);
    const picks = list.rows.slice(0, 4).map((r) => r.actuator.id);
    return (
        <section className="req-list" aria-labelledby="req-list-title">
            <header className="req-list-head">
                <h2 id="req-list-title">{heading}</h2>
                <p>
                    {list.total
                        ? summary(list.total, list.unknownSpeed, torqueNm, speedRpm)
                        : `No catalog entry documents ${fmt(torqueNm)} N·m${speedRpm ? ` at ${fmt(speedRpm)} rpm` : ""}. Add a gearbox stage or relax the requirement.`}
                </p>
                {list.rows.length > 0 && <ShortlistKey speed={speedRpm != null} />}
            </header>
            {list.rows.length > 0 && (
                <ol className="req-rows">
                    {list.rows.map(({ actuator: a, torque, speed }) => {
                        const note = integrationNote(a);
                        return (
                            <li key={a.id} className={`req-row fit-${torque}`}>
                                <a href={`/actuators/${encodeURIComponent(a.id)}`} className="req-name">
                                    <span className="req-brand">{a.brand}</span>
                                    {a.name}
                                </a>
                                <dl className="req-specs">
                                    <div><dt>Rated</dt><dd>{a.rated_torque_nm != null ? `${fmt(a.rated_torque_nm)} N·m` : "n/d"}</dd></div>
                                    <div><dt>Peak</dt><dd>{a.peak_torque_nm != null ? `${fmt(a.peak_torque_nm)} N·m` : "n/d"}</dd></div>
                                    <div><dt>Max speed</dt><dd>{a.max_speed_rpm != null ? `${fmt(a.max_speed_rpm)} rpm` : "n/d"}</dd></div>
                                    <div><dt>Mass</dt><dd>{a.weight_g != null ? `${fmt(a.weight_g)} g` : "n/d"}</dd></div>
                                </dl>
                                <p className="req-tags">
                                    <FitGauge need={torqueNm} rated={a.rated_torque_nm} peak={a.peak_torque_nm} />
                                    {speed !== "none" && speedRpm != null && <SpeedGlyph known={speed === "meets"} rpm={speedRpm} />}
                                    {note && <DriverGlyph />}
                                    <span className="sr-only">
                                        {[TORQUE_FIT_LABEL[torque], speed !== "none" ? SPEED_FIT_LABEL[speed] : "", note ?? ""].filter(Boolean).join(". ")}
                                    </span>
                                </p>
                                {onUse && a.weight_g != null && (
                                    <button type="button" className="req-use" onClick={() => onUse.act(a)}>
                                        {onUse.label(a)}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ol>
            )}
            <p className="req-actions">
                {picks.length >= 2 && (
                    <a className="req-cta" href={compareHref(picks)}>
                        Compare top {picks.length} side by side →
                    </a>
                )}
                <a href="/all">Browse all {ACTUATORS.length} actuators</a>
            </p>
        </section>
    );
}
