import { useEffect, useMemo, useState } from "react";
import { PublicHeader } from "../../components/PublicHeader";
import { PublicFooter } from "../../components/PublicFooter";
import {
    ACTUATOR_TYPE_COLOR,
    ACTUATOR_TYPE_LABEL,
    ACTUATOR_TYPES,
    type CanonicalJoint,
    getHumanoid,
    HUMANOIDS,
    HUMANOIDS_AS_OF,
    HUMANOIDS_PATH,
    type Humanoid,
    humanoidTotals,
} from "../../../../src/humanoids";
import { FleetTable } from "./FleetTable";
import { JointPanel } from "./JointPanel";
import { Method } from "./Method";
import { Silhouette } from "./Silhouette";
import { Totals } from "./Totals";
import "../tools.css";
import "./humanoids.css";

const TITLE = "Humanoid joint map";

interface State {
    robot: string;
    vs: string | null;
    joint: CanonicalJoint | null;
}

function readState(): State {
    const q = new URLSearchParams(window.location.search);
    const robot = getHumanoid(q.get("robot") ?? "")?.id ?? HUMANOIDS[0]!.id;
    const vsId = getHumanoid(q.get("vs") ?? "")?.id ?? null;
    const joint = (q.get("joint") as CanonicalJoint | null) ?? null;
    return { robot, vs: vsId === robot ? null : vsId, joint };
}

function writeState(s: State) {
    const q = new URLSearchParams(window.location.search);
    q.set("robot", s.robot);
    if (s.vs) q.set("vs", s.vs);
    else q.delete("vs");
    if (s.joint) q.set("joint", s.joint);
    else q.delete("joint");
    window.history.replaceState(window.history.state, "", `${HUMANOIDS_PATH}?${q}${window.location.hash}`);
}

function Picker({
    label,
    value,
    onChange,
    none,
    exclude,
}: {
    label: string;
    value: string | null;
    onChange: (id: string | null) => void;
    none?: string;
    exclude?: string;
}) {
    return (
        <label className="hm-pick">
            <span>{label}</span>
            <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
                {none && <option value="">{none}</option>}
                {HUMANOIDS.filter((h) => h.id !== exclude).map((h) => (
                    <option key={h.id} value={h.id}>
                        {h.name} ({h.brand})
                    </option>
                ))}
            </select>
        </label>
    );
}

function Card({ robot, joint, onJoint }: { robot: Humanoid; joint: CanonicalJoint | null; onJoint: (j: CanonicalJoint | null) => void }) {
    const totals = useMemo(() => humanoidTotals(robot), [robot]);
    return (
        <figure className="hm-card">
            <figcaption>
                <b>{robot.name}</b>
                <span>
                    {robot.brand} · {robot.country}
                </span>
            </figcaption>
            <Silhouette robot={robot} selected={joint} onSelect={onJoint} />
            <Totals totals={totals} dof={robot.dof} />
        </figure>
    );
}

function Legend() {
    return (
        <div className="hm-legend" aria-label="Legend">
            {ACTUATOR_TYPES.map((t) => (
                <span key={t}>
                    <i style={{ background: t === "other" ? undefined : ACTUATOR_TYPE_COLOR[t] }} className={t === "other" ? "is-other" : undefined} />
                    {ACTUATOR_TYPE_LABEL[t]}
                </span>
            ))}
            <span className="hm-legend-sep">
                <i className="hm-key-fill" />
                type reported
            </span>
            <span>
                <i className="hm-key-ring" />
                type estimated
            </span>
        </div>
    );
}

export function Humanoids({ menuOpen = false }: { menuOpen?: boolean }) {
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
            if (next.vs === next.robot) next.vs = null;
            writeState(next);
            return next;
        });
    const a = getHumanoid(state.robot) ?? HUMANOIDS[0]!;
    const b = state.vs ? getHumanoid(state.vs) : undefined;
    const onJoint = (joint: CanonicalJoint | null) => update({ joint });

    return (
        <div className="tool-page hm-page">
            <PublicHeader path={HUMANOIDS_PATH} initialOpen={menuOpen} />
            <main className="tool-main">
                <header className="tool-head">
                    <p className="tool-kicker">Humanoids</p>
                    <h1>What moves each joint</h1>
                    <p className="tool-lede">
                        {HUMANOIDS.length} humanoids, joint by joint, with estimated magnet and rare-earth content. As of{" "}
                        {HUMANOIDS_AS_OF}.
                    </p>
                </header>

                <div className="hm-bar">
                    <Picker label="Robot" value={a.id} onChange={(id) => id && update({ robot: id })} />
                    <Picker label="Compare" value={b?.id ?? null} none="None" exclude={a.id} onChange={(vs) => update({ vs })} />
                </div>
                <Legend />

                <section className={`hm-stage${b ? " is-compare" : ""}`} aria-label="Joint map">
                    <Card robot={a} joint={state.joint} onJoint={onJoint} />
                    {b && <Card robot={b} joint={state.joint} onJoint={onJoint} />}
                    <div className="hm-panels">
                        <JointPanel robot={a} joint={state.joint} onSelect={onJoint} />
                        {b && <JointPanel robot={b} joint={state.joint} onSelect={onJoint} />}
                    </div>
                </section>

                <FleetTable
                    active={a.id}
                    onPick={(robot) => {
                        update({ robot });
                        document.querySelector(".hm-bar")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
                    }}
                />

                <Method />
            </main>
            <PublicFooter />
        </div>
    );
}
