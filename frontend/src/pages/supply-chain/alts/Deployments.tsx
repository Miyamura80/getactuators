import { useMemo } from "react";
import { countryName } from "../../../../../src/country-flag";
import type { Segment } from "../../../../../src/supply-chain/companies";
import {
    type AltFamily,
    DEPLOYMENTS,
    type Deployment,
    type DeploymentStatus,
    getAltTech,
} from "../../../../../src/supply-chain/alts";
import type { MapPin } from "../../../../../src/supply-chain/map";
import { Flag } from "../../../components/Flag";
import { Pins } from "../../../components/maps/Pins";
import { WorldMap } from "../../../components/maps/WorldMap";
import { FootnoteRef } from "../../../components/supply-chain/SourcedValue";

// Where each alternative runs today: a world mini-map of the dated
// deployments and one card per deployment, newest first. Retired ones stay,
// struck through, so a replaced hydraulic robot still counts as history.

const SEGMENT_OF: Record<AltFamily, Segment> = {
    "ree-free-motor": "magnets-motors",
    "artificial-muscle": "robot-actuator-oem",
    hydraulic: "robot-actuator-oem",
    transmission: "gears-screws-bearings",
};

const STATUS_LABEL: Record<DeploymentStatus, string> = {
    shipping: "Shipping",
    pilot: "Pilot",
    demo: "Demo",
    retired: "Retired",
};

const sortKey = (d: Deployment) => d.date.padEnd(10, "-");

export function Deployments({ tech, onTech }: { tech: string | null; onTech: (id: string) => void }) {
    const pins = useMemo<MapPin[]>(
        () =>
            DEPLOYMENTS.flatMap((d) => {
                const t = getAltTech(d.techId);
                if (!d.location || !t) return [];
                return [{
                    id: d.id,
                    label: `${d.org} · ${d.location.place}`,
                    company: d.org,
                    segment: SEGMENT_OF[t.family],
                    precision: "city" as const,
                    country: d.location.country,
                    lat: d.location.lat,
                    lon: d.location.lon,
                    companyId: d.companyId,
                }];
            }),
        [],
    );
    const shown = tech ? pins.filter((p) => DEPLOYMENTS.find((d) => d.id === p.id)?.techId === tech) : pins;
    const cards = [...DEPLOYMENTS].sort((a, b) => {
        const on = Number(b.techId === tech) - Number(a.techId === tech);
        return on || sortKey(b).localeCompare(sortKey(a));
    });
    const onPin = (p: MapPin) => {
        const d = DEPLOYMENTS.find((x) => x.id === p.id);
        if (d) onTech(d.techId);
    };
    return <div className="al-dep">
        <div className="al-dep-map">
            <WorldMap label="Where the alternatives run" valueLabel="Deployments">
                <Pins pins={shown.length ? shown : pins} onSelect={onPin} table="Deployments" labels={false} />
            </WorldMap>
            {tech && shown.length === 0 ? <p className="al-note">No located deployment for {getAltTech(tech)?.name}; all shown.</p> : null}
        </div>
        <ol className="al-dep-cards">
            {cards.map((d) => {
                const t = getAltTech(d.techId);
                return <li key={d.id} className={`al-card is-${d.status}${d.techId === tech ? " is-on" : ""}`}>
                    <p className="al-card-meta">
                        <span className={`al-status is-${d.status}`}>{STATUS_LABEL[d.status]}</span>
                        <time>{d.date}</time>
                        <FootnoteRef sources={d.sources} asOf={d.date} confidence="reported" />
                    </p>
                    <p className="al-card-what">{d.product}</p>
                    <p className="al-card-who">
                        {d.location ? <Flag code={d.location.country} /> : null}
                        <span>{d.org}{d.location ? `, ${d.location.place}` : ""}</span>
                    </p>
                    <button type="button" className="al-chip" aria-pressed={d.techId === tech} onClick={() => onTech(d.techId)}
                        aria-label={`${t?.name ?? d.techId}${d.location ? `, ${countryName(d.location.country)}` : ""}`}>{t?.short ?? d.techId}</button>
                </li>;
            })}
        </ol>
    </div>;
}
