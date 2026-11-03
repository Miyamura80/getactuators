import { useEffect, useMemo, useState } from "react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicHeader } from "../../components/PublicHeader";
import { FootnotesProvider } from "../../components/supply-chain/footnotes";
import { SourcesSection } from "../../components/supply-chain/SourcesSection";
import {
    DIMENSION_SHORT,
    PRESET_LABEL,
    PRESET_WEIGHTS,
    SDK_AS_OF,
    SDK_DIMENSIONS,
    SDK_METHOD,
    SDK_PATH,
    SDK_PRESETS,
    type SdkDimension,
    type SdkPreset,
    UNSCORED_BRANDS,
    sdkLeaderboard,
} from "../../../../src/sdk";
import { SDK_EVIDENCE } from "../../../../src/sdk/evidence";
import { SdkCapabilities, SdkPainPoints, SdkTimeline } from "./BrandViews";
import { EvidencePanel } from "./Evidence";
import { SdkHeatmap } from "./Heatmap";
import { SdkLeaderboard } from "./Leaderboard";
import { SdkRadar } from "./Radar";
import { type Focus, readFocus, readPreset, writeState } from "./state";
import { SdkValueScatter } from "./ValueScatter";
import "../tools.css";
import "../../components/supply-chain/supply-chain.css";
import "./sdk.css";

const TITLE = "Best actuator SDKs";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    return <section className="sdk-sec" aria-labelledby={`${id}-h`}>
        <h2 id={`${id}-h`}>{title}</h2>
        {children}
    </section>;
}

export function Sdk({ menuOpen = false }: { menuOpen?: boolean }) {
    const [preset, setPreset] = useState<SdkPreset>(() => readPreset());
    const [focus, setFocus] = useState<Focus>(() => readFocus());
    const rows = useMemo(() => sdkLeaderboard(preset), [preset]);
    const [compare, setCompare] = useState<string[]>(() => rows.slice(0, 3).map((r) => r.brand.id));
    const focused = rows.find((r) => r.brand.id === focus.brand) ?? rows[0];

    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        const onHash = () => setFocus(readFocus());
        window.addEventListener("hashchange", onHash);
        return () => {
            document.title = prev;
            window.removeEventListener("hashchange", onHash);
        };
    }, []);
    useEffect(() => writeState(preset, focus), [preset, focus]);
    useEffect(() => {
        if (focus.brand && !focus.dim) document.getElementById(`sdk-brand-${focus.brand}`)?.scrollIntoView?.({ block: "center" });
    }, [focus.brand, focus.dim]);

    const toggleCompare = (id: string) =>
        setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 4 ? [...c, id] : c));
    const openCell = (brand: string, dim: SdkDimension) =>
        setFocus((f) => (f.brand === brand && f.dim === dim ? { brand, dim: null } : { brand, dim }));
    const compared = compare.map((id) => rows.find((r) => r.brand.id === id)).filter((r) => r !== undefined);
    const agreement = SDK_METHOD.gold.agreement;

    return <div className="tool-page sdk-page">
        <PublicHeader path={SDK_PATH} initialOpen={menuOpen} />
        <FootnotesProvider>
            <main className="tool-main">
                <header className="tool-head sdk-head">
                    <p className="tool-kicker">Ecosystem · as of {SDK_AS_OF}</p>
                    <h1>Which actuators have the best SDK?</h1>
                    <p className="tool-lede">{rows.length} brands scored on seven dimensions from cited checks and {SDK_EVIDENCE.length} developer claims on Reddit, Hacker News and GitHub.</p>
                    <a className="sdk-cta" href="/api/v1/sdk">Get the data</a>
                </header>

                <div className="sdk-presets" role="group" aria-label="Reader preset">
                    {SDK_PRESETS.map((p) => <button key={p} type="button" aria-pressed={preset === p} onClick={() => setPreset(p)}>{PRESET_LABEL[p]}</button>)}
                </div>
                <p className="sdk-weights">
                    {SDK_DIMENSIONS.map((d) => <span key={d}>{DIMENSION_SHORT[d]} <b>{Math.round(PRESET_WEIGHTS[preset][d] * 100)}%</b></span>)}
                </p>

                <Section id="sdk-board" title="Leaderboard">
                    <SdkLeaderboard rows={rows} compare={compare} toggleCompare={toggleCompare}
                        focus={(id) => setFocus({ brand: id, dim: null })} />
                </Section>

                <Section id="sdk-heat" title="Scores by dimension">
                    <SdkHeatmap rows={rows} open={focus} onOpen={openCell} />
                    {focus.brand && focus.dim
                        ? <EvidencePanel brand={focus.brand} dim={focus.dim} onClose={() => setFocus({ brand: focus.brand, dim: null })} />
                        : <p className="sdk-muted">Pick a cell to see the checks and posts behind it.</p>}
                </Section>

                <Section id="sdk-compare" title="Compare profiles">
                    <SdkRadar brands={compared} remove={toggleCompare} clear={() => setCompare([])} />
                </Section>

                <Section id="sdk-value" title="SDK quality for the money">
                    <SdkValueScatter rows={rows} focus={(id) => setFocus({ brand: id, dim: null })} />
                </Section>

                {focused ? <Section id="sdk-focus" title={`${focused.brand.name}: sentiment and pain points`}>
                    <label className="sdk-select">
                        <span>Brand</span>
                        <select value={focused.brand.id} onChange={(e) => setFocus({ brand: e.target.value, dim: null })}>
                            {rows.map((r) => <option key={r.brand.id} value={r.brand.id}>{r.brand.name}</option>)}
                        </select>
                    </label>
                    <SdkTimeline brand={focused} />
                    <SdkPainPoints brand={focused} />
                </Section> : null}

                <Section id="sdk-caps" title="What ships">
                    <SdkCapabilities rows={rows} />
                </Section>

                <details className="sdk-method">
                    <summary>Method and label agreement</summary>
                    <p>Each dimension blends objective checks (60%, cited) with developer posts (up to 40%, growing with the number of posts, halving in weight every 24 months; a GitHub issue counts 0.35 of a discussion post since trackers collect bug reports), plus a small pull toward 50 so one check cannot pin a score to 0 or 100. A dimension with no data counts as 50 in the overall. Each post was read once ({SDK_METHOD.labelledBy}) and its claims labelled by dimension and polarity and summarised in our words; the labels are committed, no model API runs, and no quotes or usernames are kept. {SDK_METHOD.postsMatched} of {SDK_METHOD.postsScanned} scanned posts named a brand.</p>
                    <p>Check set: {SDK_METHOD.gold.items} posts labelled separately ({SDK_METHOD.gold.labelledBy}). Agreement per dimension:</p>
                    <ul className="sdk-agree">
                        {agreement.map((a) => <li key={a.dimension}><span>{DIMENSION_SHORT[a.dimension]}</span><b>{Math.round(a.agreement * 100)}%</b><small>claim overlap {Math.round(a.overlap * 100)}%</small></li>)}
                    </ul>
                    <p>Not scored: {UNSCORED_BRANDS.map((b) => b.name).join(", ")} (reducers or bare motors with no software of their own).</p>
                </details>

                <SourcesSection />
            </main>
        </FootnotesProvider>
        <PublicFooter />
    </div>;
}
