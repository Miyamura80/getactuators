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
import { SDK_EVIDENCE, redditSeedNote } from "../../../../src/sdk/evidence";
import { SdkCapabilities, SdkPainPoints, SdkTimeline } from "./BrandViews";
import { EVIDENCE_PANEL_ID, EvidencePanel } from "./Evidence";
import { SdkHeatmap } from "./Heatmap";
import { SdkLeaderboard } from "./Leaderboard";
import { SdkRadar } from "./Radar";
import { type Focus, SLOT_COLORS, readFocus, readPreset, writeState } from "./state";
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
    // Four compare slots; a brand keeps its slot (and colour) until removed.
    const [slots, setSlots] = useState<(string | null)[]>(() =>
        SLOT_COLORS.map((_, i) => (i < 3 ? (rows[i]?.brand.id ?? null) : null)));
    const compare = slots.filter((id): id is string => id !== null);
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
    // Bring the focused brand's row, or the open cell's evidence, into view
    // (deep links, badges and hash changes as well as clicks).
    useEffect(() => {
        if (!focus.brand) return;
        if (focus.dim) document.getElementById(EVIDENCE_PANEL_ID)?.scrollIntoView?.({ block: "nearest" });
        else document.getElementById(`sdk-brand-${focus.brand}`)?.scrollIntoView?.({ block: "center" });
    }, [focus.brand, focus.dim]);

    const toggleCompare = (id: string) =>
        setSlots((s) => {
            if (s.includes(id)) return s.map((x) => (x === id ? null : x));
            const free = s.indexOf(null);
            return free < 0 ? s : s.map((x, i) => (i === free ? id : x));
        });
    const colorOf = (id: string) => SLOT_COLORS[Math.max(0, slots.indexOf(id))] ?? SLOT_COLORS[0];
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
                    <SdkRadar brands={compared} colorOf={colorOf} remove={toggleCompare} clear={() => setSlots(SLOT_COLORS.map(() => null))} />
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
                    <p>Each dimension blends objective checks (60%, cited) with developer posts (up to 40%, growing with the number of posts, halving in weight every 24 months; a GitHub issue counts 0.35 of a discussion post since trackers collect bug reports), plus a small pull toward 50 so one check cannot pin a score to 0 or 100. A dimension with no data counts as 50 in the overall. Each post was read once ({SDK_METHOD.labelledBy}) and its claims labelled by dimension and polarity and summarised in our words; the labels are committed, no model API runs, and no quotes or usernames are kept. {SDK_METHOD.postsMatched} of {SDK_METHOD.postsScanned} scanned posts named a brand. {redditSeedNote()}</p>
                    <p>Check set: {SDK_METHOD.gold.items} posts labelled separately ({SDK_METHOD.gold.labelledBy}). Agreement per dimension, with the number of gold claims it rests on; most gold posts make no claim, so a dimension with no gold claims is not measured:</p>
                    <ul className="sdk-agree">
                        {agreement.map((a) => <li key={a.dimension}><span>{DIMENSION_SHORT[a.dimension]}</span>{a.goldItems === 0
                            ? <><b>n/a</b><small>0 gold claims</small></>
                            : <><b>{Math.round(a.agreement * 100)}%</b><small>{a.goldItems} gold claim{a.goldItems === 1 ? "" : "s"}, overlap {Math.round(a.overlap * 100)}%</small></>}</li>)}
                    </ul>
                    <p>Not scored: {UNSCORED_BRANDS.map((b) => b.name).join(", ")} (reducers or bare motors with no software of their own).</p>
                </details>

                <SourcesSection />
            </main>
        </FootnotesProvider>
        <PublicFooter />
    </div>;
}
