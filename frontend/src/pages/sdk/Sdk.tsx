import { useEffect, useMemo, useState } from "react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicHeader } from "../../components/PublicHeader";
import { PRESETS, SDK_PATH, SDK_SCORES, brandScore, leaderboard, presetById, scoredBrands } from "../../../../src/sdk";
import type { BrandScore } from "../../../../src/sdk/types";
import { Capabilities } from "./Capabilities";
import { Themes, Timeline } from "./Community";
import { Heatmap } from "./Heatmap";
import { Method } from "./Method";
import { PriceScatter } from "./PriceScatter";
import { Radar } from "./Radar";
import { SdkLeaderboard } from "./SdkLeaderboard";
import { Section } from "./shared";
import { MAX_COMPARE, type SdkState, readState, writeState } from "./url-state";
import "../tools.css";
import "./sdk.css";

const TITLE = "Best actuator SDKs";

const BRAND_IDS = scoredBrands().map((b) => b.brand);
const DEFAULT_COMPARE = leaderboard().slice(0, 3).map((r) => r.brand.brand);

// /sdk: which actuators are easiest to talk to from code. Preset, focused
// brand, open heatmap cell and the radar compare set live in the URL.
export function Sdk({ menuOpen = false }: { menuOpen?: boolean }) {
    const [state, setState] = useState<SdkState>(() => readState(window.location.search, BRAND_IDS, DEFAULT_COMPARE));
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => { document.title = prev; };
    }, []);
    const update = (patch: Partial<SdkState>) => {
        setState((cur) => {
            const next = { ...cur, ...patch };
            const search = writeState(window.location.search, next, DEFAULT_COMPARE);
            window.history.replaceState(window.history.state, "", `${SDK_PATH}${search}${window.location.hash}`);
            return next;
        });
    };
    const preset = presetById(state.preset);
    const rows = useMemo(() => leaderboard(preset), [preset]);
    const focus = state.brand ? brandScore(state.brand) ?? null : null;
    const compared = state.compare.map(brandScore).filter((b): b is BrandScore => !!b);
    const select = (brand: string) => {
        const compare = state.compare.includes(brand) || state.compare.length >= MAX_COMPARE ? state.compare : [...state.compare, brand];
        update({ brand: state.brand === brand ? null : brand, dim: null, compare });
    };
    return <div className="tool-page sdk-page">
        <PublicHeader path={SDK_PATH} initialOpen={menuOpen} />
        <main className="tool-main">
            <header className="tool-head sdk-head">
                <p className="tool-kicker">Developer experience · as of {SDK_SCORES.asOf}</p>
                <h1>{TITLE}</h1>
                <p className="tool-lede">How painful is each actuator to talk to from code? Seven angles, every score traced to a repo file, doc or post.</p>
                <a className="sdk-cta" href="/api/v1/sdk">Get the data</a>
            </header>

            <div className="sdk-presets" role="group" aria-label="Preset">
                {PRESETS.map((p) => <button key={p.id} type="button" aria-pressed={p.id === preset.id} className={p.id === preset.id ? "is-on" : ""}
                    onClick={() => update({ preset: p.id })}>{p.label}</button>)}
            </div>

            <Section n="01" id="leaderboard" title="Leaderboard" note="Score out of 10 · evidence items · share of the weight that could be scored">
                <SdkLeaderboard rows={rows} selected={state.brand} onSelect={select} />
            </Section>

            <Section n="02" id="heatmap" title="By dimension" note="Click a cell for the checks and evidence behind it.">
                <Heatmap rows={rows} brand={state.brand} dim={state.dim} onCell={(brand, dim) => update({ brand, dim })} />
            </Section>

            <Section n="03" id="compare" title="Compare">
                <Radar brands={compared} all={scoredBrands()} onChange={(compare) => update({ compare })} />
            </Section>

            <Section n="04" id="value" title="SDK vs price per N·m">
                <PriceScatter rows={rows} />
            </Section>

            <Section n="05" id="timeline" title={`Forum mentions${focus ? `: ${focus.name}` : ""}`}>
                <Timeline brand={focus} />
            </Section>

            <Section n="06" id="themes" title={`What posts discuss${focus ? `: ${focus.name}` : ""}`}>
                <Themes brand={focus} />
            </Section>

            <Section n="07" id="capabilities" title="Capability matrix">
                <Capabilities rows={rows} />
            </Section>

            <Method preset={preset} />
        </main>
        <PublicFooter />
    </div>;
}
