import { useEffect, useState } from "react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicHeader } from "../../components/PublicHeader";
import { getActuator } from "../../../../src/catalog";
import { PRICES_AS_OF, PRICES_PATH, PRICE_POINTS, actuatorsWithHistory } from "../../../../src/prices";
import { ActuatorView } from "./ActuatorView";
import { CompareView } from "./CompareView";
import { MetalsView } from "./MetalsView";
import { TrendView } from "./TrendView";
import "../tools.css";
import "../trends/trends.css";
import "./prices.css";

export const PRICE_VIEWS = [
    ["trend", "$/N·m trend"],
    ["compare", "Country & brand"],
    ["actuator", "One actuator"],
    ["metals", "vs NdPr"],
] as const;
export type PriceView = (typeof PRICE_VIEWS)[number][0];

const TITLE = "Actuator prices";

function isView(v: string | null): v is PriceView {
    return PRICE_VIEWS.some(([id]) => id === v);
}

// ?actuator=<id> opens that actuator's history; ?view= picks a view.
function readState(): { view: PriceView; actuator: string } {
    const q = new URLSearchParams(window.location.search);
    const id = q.get("actuator");
    const actuator = id && getActuator(id) ? id : (actuatorsWithHistory()[0] ?? "");
    const v = q.get("view");
    const view: PriceView = id && getActuator(id) ? "actuator" : isView(v) ? v : "trend";
    return { view, actuator };
}

export function Prices({ menuOpen = false }: { menuOpen?: boolean }) {
    const [state, setState] = useState(readState);
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => {
            document.title = prev;
        };
    }, []);
    const update = (next: { view: PriceView; actuator: string }) => {
        setState(next);
        // Keep unrelated parameters (tracking and the like); set only ours.
        const q = new URLSearchParams(window.location.search);
        q.delete("actuator");
        q.delete("view");
        if (next.view === "actuator") q.set("actuator", next.actuator);
        else if (next.view !== "trend") q.set("view", next.view);
        const qs = q.toString();
        window.history.replaceState(window.history.state, "", `${PRICES_PATH}${qs ? `?${qs}` : ""}`);
    };
    const n = actuatorsWithHistory().length;
    return (
        <div className="tool-page tr-page pr-page">
            <PublicHeader path={PRICES_PATH} initialOpen={menuOpen} />
            <main className="tool-main">
                <header className="tr-head">
                    <h1>How actuator prices move</h1>
                    <p>
                        {n} actuators · {PRICE_POINTS.length} dated prices · {PRICES_AS_OF}
                    </p>
                </header>
                <div className="pr-tabs" role="group" aria-label="View">
                    {PRICE_VIEWS.map(([id, label]) => (
                        <button key={id} type="button" aria-pressed={state.view === id} onClick={() => update({ ...state, view: id })}>
                            {label}
                        </button>
                    ))}
                </div>
                <p className="pr-status" aria-live="polite">
                    {PRICE_VIEWS.find(([v]) => v === state.view)?.[1]}
                    {state.view === "actuator" && state.actuator ? `: ${getActuator(state.actuator)?.name ?? state.actuator}` : ""}
                </p>
                <div className="pr-panel">
                    {state.view === "trend" && <TrendView />}
                    {state.view === "compare" && <CompareView />}
                    {state.view === "actuator" && (
                        <ActuatorView id={state.actuator} onPick={(id) => update({ view: "actuator", actuator: id })} />
                    )}
                    {state.view === "metals" && <MetalsView />}
                </div>
            </main>
            <PublicFooter />
        </div>
    );
}
