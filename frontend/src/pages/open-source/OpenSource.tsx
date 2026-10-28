import { type ReactNode, useEffect, useMemo, useState } from "react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicHeader } from "../../components/PublicHeader";
import {
    EXCLUDED_CANDIDATES,
    OPEN_ROBOTS,
    OPEN_ROBOTS_AS_OF,
    OPEN_ROBOT_TYPES,
    OPEN_ROBOT_TYPE_LABEL,
    OPEN_SOURCE_PATH,
    REPO_STATS,
    actuatorUsage,
    getOpenRobot,
    robotsUsing,
} from "../../../../src/open-source";
import { CostScatter } from "./CostScatter";
import { FamilyTree } from "./FamilyTree";
import { Gallery } from "./Gallery";
import { Matrix } from "./Matrix";
import { RobotDetail } from "./RobotDetail";
import { UsageChart } from "./UsageChart";
import { type OpenSourceState, readState, writeState } from "./url-state";
import "../tools.css";
import "./open-source.css";

const TITLE = "Open-source robots";

function usageLabel(key: string): string {
    if (key.startsWith("brand:")) return key.slice("brand:".length);
    return actuatorUsage().find((u) => u.key === key)?.name ?? key;
}

function Section({ n, title, lede, children }: { n: string; title: string; lede: string; children: ReactNode }) {
    return (
        <section className="os-section" aria-labelledby={`os-${n}`}>
            <h2 id={`os-${n}`}>
                <span>{n}</span>
                {title}
            </h2>
            <p className="os-lede">{lede}</p>
            {children}
        </section>
    );
}

export function OpenSource({ menuOpen = false }: { menuOpen?: boolean }) {
    const [state, setState] = useState<OpenSourceState>(readState);
    useEffect(() => {
        const sync = () => setState(readState());
        window.addEventListener("popstate", sync);
        return () => window.removeEventListener("popstate", sync);
    }, []);
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => {
            document.title = prev;
        };
    }, []);
    const update = (patch: Partial<OpenSourceState>) =>
        setState((s) => {
            const next = { ...s, ...patch };
            writeState(next);
            return next;
        });
    const pick = (id: string) => {
        update({ robot: id });
        const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        document.getElementById("os-detail")?.scrollIntoView?.({ behavior: still ? "auto" : "smooth", block: "start" });
    };

    const shown = useMemo(() => {
        const ofType = OPEN_ROBOTS.filter((r) => !state.type || r.type === state.type);
        return state.uses ? robotsUsing(state.uses, ofType) : ofType;
    }, [state.type, state.uses]);
    const robot = state.robot ? getOpenRobot(state.robot) : undefined;
    const passing = OPEN_ROBOTS.filter((r) => r.meetsInclusionRule).length;

    return (
        <div className="tool-page os-page">
            <PublicHeader path={OPEN_SOURCE_PATH} initialOpen={menuOpen} />
            <main className="tool-main">
                <header className="tool-head">
                    <p className="tool-kicker">Open source</p>
                    <h1>Robots you can build</h1>
                    <p className="tool-lede">
                        {OPEN_ROBOTS.length} open robots, the actuator in each joint and how open each one is: CAD, electronics, firmware,
                        software, BOM, assembly guide, sim model and licence. As of {OPEN_ROBOTS_AS_OF}. For robots with an open SDK but closed
                        hardware, see <a href="/sdk">/sdk</a>.
                    </p>
                </header>

                <Section n="01" title="Gallery" lede={`${passing} meet the inclusion rule: mechanical design, or full BOM plus build instructions, public under a stated licence. Dashed cards fall short.`}>
                    <div className="os-filters">
                        <div className="os-seg" role="group" aria-label="Robot type">
                            <button type="button" aria-pressed={!state.type} className={state.type ? undefined : "is-on"} onClick={() => update({ type: null })}>
                                All
                            </button>
                            {OPEN_ROBOT_TYPES.map((t) => (
                                <button key={t} type="button" aria-pressed={state.type === t} className={state.type === t ? "is-on" : undefined} onClick={() => update({ type: t })}>
                                    {OPEN_ROBOT_TYPE_LABEL[t]}
                                </button>
                            ))}
                        </div>
                        {state.uses && (
                            <button
                                type="button"
                                className="os-filter-chip"
                                aria-label={`Clear filter: uses ${usageLabel(state.uses)}`}
                                onClick={() => update({ uses: null })}
                            >
                                Uses {usageLabel(state.uses)} <span aria-hidden="true">×</span>
                            </button>
                        )}
                    </div>
                    <Gallery robots={shown} selected={robot?.id ?? null} onPick={pick} />
                    <div id="os-detail">{robot && <RobotDetail robot={robot} onPick={pick} />}</div>
                </Section>

                <Section n="02" title="How open, really" lede="Filled: published in full. Half: partly (STL without source CAD, a non-commercial licence, an incomplete guide). Empty: not found. Each cell links to what it was judged from; the score counts half for partial.">
                    <Matrix robots={shown} selected={robot?.id ?? null} onPick={pick} />
                </Section>

                <Section n="03" title="Actuators they build on" lede="Joints per actuator model across all the open robots. Pick a bar to filter the gallery to the robots that use it.">
                    <UsageChart
                        by={state.by}
                        active={state.uses}
                        onBy={(by) => update({ by, uses: null })}
                        onPick={(uses) => update({ uses })}
                    />
                </Section>

                <Section n="04" title="Cost against capability" lede="Published cost to build against degrees of freedom. Bubble size is community size (GitHub stars).">
                    <CostScatter robots={shown} selected={robot?.id ?? null} onPick={pick} />
                </Section>

                <Section n="05" title="Family tree" lede="Forks and derivatives: which open designs others built on.">
                    <FamilyTree selected={robot?.id ?? null} onPick={pick} />
                </Section>

                <details className="os-more">
                    <summary>Checked and left out ({EXCLUDED_CANDIDATES.length})</summary>
                    <ul>
                        {EXCLUDED_CANDIDATES.map((c) => (
                            <li key={c.name}>
                                <a href={c.url} target="_blank" rel="noreferrer">
                                    {c.name}
                                </a>
                                : {c.reason}
                            </li>
                        ))}
                    </ul>
                </details>
                <details className="os-more">
                    <summary>Method</summary>
                    <p>
                        GitHub stars and last commit are a snapshot from {REPO_STATS.asOf}: {REPO_STATS.method} Costs are each project's own
                        figure, a parts BOM or a kit or system price where no BOM total is published; euro figures are not converted. Joints map to
                        catalog actuators where the motor is in the catalog; the rest are named and marked not in catalog. The same data is at{" "}
                        <a href="/open-source.md">/open-source.md</a>, <a href="/api/v1/open-robots">/api/v1/open-robots</a> and the MCP tool
                        list_open_robots.
                    </p>
                </details>
            </main>
            <PublicFooter />
        </div>
    );
}
