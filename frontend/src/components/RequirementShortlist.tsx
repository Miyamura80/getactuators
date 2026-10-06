import { ACTUATORS } from "../lib/data";
import type { Actuator } from "../types";
import { compareHref } from "../lib/compare-selection";
import { fmt } from "../lib/motor-torque";
import {
    SPEED_FIT_LABEL,
    TORQUE_FIT_LABEL,
    integrationNote,
    shortlist,
} from "../../../src/catalog/shortlist";

// Torque matches, how many leave speed undocumented, and the real sort order.
function summary(total: number, unknownSpeed: number, torqueNm: number, speedRpm?: number): string {
    const head = `${total} catalog ${total === 1 ? "entry covers" : "entries cover"} ${fmt(torqueNm)} N·m`;
    if (!speedRpm) return `${head}. Rated fits first, then lightest.`;
    const known = total - unknownSpeed;
    const speed = unknownSpeed
        ? `${known} ${known === 1 ? "documents" : "document"} ${fmt(speedRpm)} rpm, ${unknownSpeed} ${unknownSpeed === 1 ? "does" : "do"} not document speed`
        : `all document ${fmt(speedRpm)} rpm`;
    return `${head}; ${speed}. Rated fits first, then documented speed, then lightest.`;
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
                                    <span className={`req-tag tag-${torque}`}>{TORQUE_FIT_LABEL[torque]}</span>
                                    {speed !== "none" && <span className={`req-tag tag-speed-${speed}`}>{SPEED_FIT_LABEL[speed]}</span>}
                                    {note && <span className="req-tag tag-note">{note}</span>}
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
            <p className="req-caveat">
                Screening only. n/d means not documented, not zero. A catalog rating is not a
                torque–speed envelope: confirm the operating point and duty cycle on the datasheet.
            </p>
        </section>
    );
}
