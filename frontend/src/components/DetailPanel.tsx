import { evidenceFor, fieldCaveat } from "../../../src/catalog/evidence";
import type { Actuator } from "../types";
import { CATEGORY_MAP } from "../types";
import { bool, dash, list, num, price, voltage } from "../lib/format";
import { CopyLinkButton } from "./CopyLinkButton";

interface Props {
    actuator: Actuator | null;
    onClose: () => void;
}

interface Spec {
    label: string;
    value: string;
}

const evidenceFields: Record<string, string> = {
    Weight: "weight_g", Encoder: "encoder", "Torque density": "torque_density_nm_per_kg",
    Backdrivable: "backdrivable", Backlash: "backlash_arcmin",
};

function specs(a: Actuator): Spec[] {
    return [
        { label: "Peak torque", value: a.peak_torque_nm == null ? dash() : `${num(a.peak_torque_nm, 1)} N·m` },
        { label: "Rated torque", value: a.rated_torque_nm == null ? dash() : `${num(a.rated_torque_nm, 1)} N·m` },
        { label: "Torque density", value: a.torque_density_nm_per_kg == null ? dash() : `${num(a.torque_density_nm_per_kg, 1)} N·m/kg` },
        { label: "Max speed", value: a.max_speed_rpm == null ? dash() : `${num(a.max_speed_rpm)} rpm` },
        { label: "Gear ratio", value: a.gear_ratio ?? dash() },
        { label: "Weight", value: a.weight_g == null ? dash() : `${num(a.weight_g)} g` },
        { label: "Backdrivable", value: bool(a.backdrivable) },
        { label: "Backlash", value: a.backlash_arcmin == null ? dash() : `${num(a.backlash_arcmin, 1)} arcmin` },
        { label: "Repeatability", value: a.repeatability_arcmin == null ? dash() : `${num(a.repeatability_arcmin, 2)} arcmin` },
        { label: "Voltage", value: voltage(a.voltage_v) },
        { label: "Peak current", value: a.peak_current_a == null ? dash() : `${num(a.peak_current_a, 1)} A` },
        { label: "Power", value: a.power_w == null ? dash() : `${num(a.power_w)} W` },
        { label: "Torque constant", value: a.kt_nm_per_a == null ? dash() : `${num(a.kt_nm_per_a, 3)} N·m/A` },
        { label: "Encoder", value: a.encoder ?? dash() },
        { label: "Comms", value: list(a.comm) },
        { label: "Control modes", value: list(a.control_modes) },
        { label: "Integrated driver", value: bool(a.integrated_driver) },
        { label: "IP rating", value: a.ip_rating ?? dash() },
        { label: "Price", value: price(a.price_usd) },
        { label: "$ / peak N·m", value: a.price_per_nm == null ? dash() : `$${num(a.price_per_nm, 1)}` },
        { label: "Origin", value: a.country ? `${a.country_flag ?? ""} ${a.country}` : dash() },
    ];
}

export function DetailPanel({ actuator, onClose }: Props) {
    if (!actuator) return null;
    const a = actuator;
    const cat = CATEGORY_MAP[a.category];
    return (
        <div className="drawer-scrim" onClick={onClose}>
            <aside
                className="drawer"
                role="dialog"
                aria-label={`${a.name} details`}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="drawer-head">
                    <div>
                        <span
                            className="cat-chip"
                            style={{ ["--hue" as string]: String(cat?.hue ?? 210) }}
                        >
                            {cat?.label ?? a.category}
                        </span>
                        <h2>{a.name}</h2>
                        <p className="drawer-brand">{a.brand}</p>
                    </div>
                    <div className="drawer-head-actions">
                        <CopyLinkButton
                            path={`/actuators/${encodeURIComponent(a.id)}`}
                            label={`Copy link to ${a.name}`}
                        />
                        <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
                            {"×"}
                        </button>
                    </div>
                </header>

                <p className="verified-note">{evidenceFor(a).label}</p>
                {evidenceFor(a).caveats.map((note) => <p className="drawer-notes" key={note}>{note}</p>)}

                <dl className="spec-grid">
                    {specs(a).map((s) => (
                        <div className="spec" key={s.label}>
                            <dt>{s.label}</dt>
                            <dd>{s.value}{fieldCaveat(a, evidenceFields[s.label] ?? s.label) && <small style={{ display: "block" }}>{fieldCaveat(a, evidenceFields[s.label] ?? s.label)}</small>}</dd>
                        </div>
                    ))}
                </dl>

                {a.notes && <p className="drawer-notes">{a.notes}</p>}

                <div className="drawer-links">
                    {a.product_url && (
                        <a href={a.product_url} data-measure-event="manufacturer_click" data-product-id={a.id} data-measure-surface="drawer" target="_blank" rel="noopener noreferrer">
                            Product page
                        </a>
                    )}
                    {a.datasheet_url && (
                        <a href={a.datasheet_url} data-measure-event="datasheet_click" data-product-id={a.id} data-measure-surface="drawer" target="_blank" rel="noopener noreferrer">
                            Datasheet
                        </a>
                    )}
                </div>

                {a.sources?.length > 0 && (
                    <div className="drawer-sources">
                        <h3>Sources</h3>
                        <ol>
                            {a.sources.map((s) => (
                                <li key={s}>
                                    <a href={s} target="_blank" rel="noopener noreferrer">
                                        {new URL(s).hostname.replace(/^www\./, "")}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
            </aside>
        </div>
    );
}
