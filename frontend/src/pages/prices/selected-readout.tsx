import { historyOf, priced } from "../../../../src/prices/history";
import type { NmPoint } from "../../../../src/prices/trends";
import type { PriceObservation } from "../../../../src/prices/types";
import { CATEGORY_MAP, type CategorySlug } from "../../types";
import { byId, classColor, perNmText, usd } from "./shared";

// The one actuator in focus under the strip: the cheapest by default, or
// the one picked. Its $/Nm, the listing behind it and where it was read.

export function SelectedReadout({ point, cheapest, points, anchor }: {
    point: NmPoint;
    cheapest: boolean;
    points: readonly PriceObservation[];
    anchor?: string;
}) {
    const a = byId.get(point.actuatorId);
    const obs = priced(historyOf(point.actuatorId, points)).at(-1);
    return <div className="pr-readout" id={anchor} aria-live="polite">
        <p className="pr-readout-k">{cheapest ? "Cheapest today" : "Selected"}</p>
        <div className="pr-readout-main">
            <a className="pr-readout-name" href={`/actuators/${encodeURIComponent(point.actuatorId)}`}>
                <i style={{ background: classColor(point.category) }} aria-hidden="true" />
                {a?.name ?? point.actuatorId}
            </a>
            <b className="pr-latest">{perNmText(point.usdPerNm)}</b>
        </div>
        <p className="pr-readout-sub">
            {[point.brand, point.country, CATEGORY_MAP[point.category as CategorySlug]?.label].filter(Boolean).join(" · ")}
            {obs ? <>
                {" · "}{usd(obs.priceUsd)} for {a?.peak_torque_nm} Nm peak · {obs.date} · <a href={obs.url} rel="nofollow noopener" target="_blank">{new URL(obs.url).host}</a>
            </> : null}
        </p>
    </div>;
}
