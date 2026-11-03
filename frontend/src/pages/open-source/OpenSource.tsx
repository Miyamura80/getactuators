import { useEffect, useMemo, useState } from "react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicHeader } from "../../components/PublicHeader";
import {
    EXCLUDED_ROBOTS,
    OPEN_ROBOTS,
    OPEN_SOURCE_AS_OF,
    OPEN_SOURCE_PATH,
    type OpenRobotType,
    ROBOT_TYPES,
    ROBOT_TYPE_LABEL,
    actuatorUsage,
    brandUsage,
    getOpenRobot,
    isOpenRobotType,
} from "../../../../src/open-source";
import { CostScatter } from "./CostScatter";
import { FamilyTree } from "./FamilyTree";
import { Gallery } from "./Gallery";
import { Matrix } from "./Matrix";
import { UsageChart } from "./UsageChart";
import "../tools.css";
import "./open-source.css";

const TITLE = "Open-source robots";

interface State {
    type: OpenRobotType | null;
    // Actuator usage key (catalog id, "unlisted:..." or "brand:...").
    actuator: string | null;
    robot: string | null;
}

function readState(): State {
    const q = new URLSearchParams(window.location.search);
    const type = q.get("type") ?? "";
    return {
        type: isOpenRobotType(type) ? type : null,
        actuator: q.get("actuator"),
        robot: getOpenRobot(q.get("robot") ?? "")?.id ?? null,
    };
}

function writeState(s: State) {
    const q = new URLSearchParams();
    if (s.type) q.set("type", s.type);
    if (s.actuator) q.set("actuator", s.actuator);
    if (s.robot) q.set("robot", s.robot);
    const search = q.toString();
    window.history.replaceState(window.history.state, "", `${OPEN_SOURCE_PATH}${search ? `?${search}` : ""}`);
}

// Robot ids using an actuator key, or null for no filter.
function usersOf(key: string | null): Set<string> | null {
    if (!key) return null;
    if (key.startsWith("brand:")) {
        const b = brandUsage().find((u) => `brand:${u.brand}` === key);
        return new Set(b?.robots ?? []);
    }
    return new Set(actuatorUsage().find((u) => u.key === key)?.robots ?? []);
}

function actuatorLabel(key: string): string {
    if (key.startsWith("brand:")) return key.slice("brand:".length);
    const u = actuatorUsage().find((x) => x.key === key);
    return u ? `${u.brand} ${u.name}` : key;
}

export function OpenSource({ menuOpen = false }: { menuOpen?: boolean }) {
    const [state, setState] = useState<State>(readState);
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => {
            document.title = prev;
        };
    }, []);
    const update = (patch: Partial<State>) =>
        setState((s) => {
            const next = { ...s, ...patch };
            writeState(next);
            return next;
        });
    const robots = useMemo(() => {
        const users = usersOf(state.actuator);
        return OPEN_ROBOTS.filter((r) => (!state.type || r.type === state.type) && (!users || users.has(r.id)));
    }, [state.type, state.actuator]);
    const select = (id: string) => {
        update({ robot: id, type: null, actuator: null });
        requestAnimationFrame(() => document.getElementById(`robot-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    };

    return (
        <div className="tool-page os-page">
            <PublicHeader path={OPEN_SOURCE_PATH} initialOpen={menuOpen} />
            <main className="tool-main">
                <header className="tool-head">
                    <p className="tool-kicker">Open source</p>
                    <h1>Robots you can build</h1>
                    <p className="tool-lede">
                        {OPEN_ROBOTS.length} open designs, the actuators in their joints and how open each really is. As of {OPEN_SOURCE_AS_OF}.
                    </p>
                </header>

                <div className="os-filters" role="group" aria-label="Robot type">
                    <button type="button" aria-pressed={state.type === null} onClick={() => update({ type: null })}>
                        All
                    </button>
                    {ROBOT_TYPES.map((t) => (
                        <button key={t} type="button" aria-pressed={state.type === t} onClick={() => update({ type: state.type === t ? null : t })}>
                            {ROBOT_TYPE_LABEL[t]}
                        </button>
                    ))}
                    {state.actuator && (
                        <button type="button" className="os-clear" onClick={() => update({ actuator: null })} aria-label="Clear actuator filter">
                            {actuatorLabel(state.actuator)} ×
                        </button>
                    )}
                </div>

                <section className="os-section" aria-labelledby="os-gallery">
                    <h2 id="os-gallery">Gallery</h2>
                    <Gallery robots={robots} active={state.robot} />
                </section>

                <section className="os-section" aria-labelledby="os-usage">
                    <h2 id="os-usage">Actuators they build on</h2>
                    <UsageChart selected={state.actuator} onSelect={(actuator) => update({ actuator })} />
                </section>

                <section className="os-section" aria-labelledby="os-matrix">
                    <h2 id="os-matrix">Openness matrix</h2>
                    <Matrix robots={robots} />
                    <p className="os-note">Score: full = 1, partial = 1/2, over eight columns. Non-commercial licences count as partial.</p>
                </section>

                <section className="os-section" aria-labelledby="os-scatter">
                    <h2 id="os-scatter">Cost and capability</h2>
                    <CostScatter robots={robots} active={state.robot} onSelect={select} />
                </section>

                <section className="os-section" aria-labelledby="os-tree">
                    <h2 id="os-tree">Family tree</h2>
                    <FamilyTree onSelect={select} />
                </section>

                <details className="os-section os-excluded">
                    <summary>Checked, not listed ({EXCLUDED_ROBOTS.length})</summary>
                    <ul>
                        {EXCLUDED_ROBOTS.map((e) => (
                            <li key={e.name}>
                                <a href={e.url} target="_blank" rel="noopener">
                                    {e.name}
                                </a>
                                : {e.reason}
                            </li>
                        ))}
                    </ul>
                </details>
            </main>
            <PublicFooter />
        </div>
    );
}
