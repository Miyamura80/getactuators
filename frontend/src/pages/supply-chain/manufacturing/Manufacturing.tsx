import { useCallback, useEffect, useState } from "react";
import { PublicFooter } from "../../../components/PublicFooter";
import { PublicHeader } from "../../../components/PublicHeader";
import { CompanyDrawer } from "../../../components/flows/CompanyDrawer";
import { FootnotesProvider } from "../../../components/supply-chain/footnotes";
import { SourcesSection } from "../../../components/supply-chain/SourcesSection";
import { useSupplyChainSelection } from "../../../lib/supply-chain-selection";
import {
    MANUFACTURING_AS_OF,
    MANUFACTURING_PATH,
    PROCESS_CHAINS,
    getChain,
} from "../../../../../src/supply-chain/processes";
import { ClusterCards } from "./ClusterCards";
import { ProcessMap } from "./ProcessMap";
import { StepCard } from "./StepCard";
import { isTarget, readChain, writeChain } from "./url-state";
import "../../tools.css";
import "../../../components/supply-chain/supply-chain.css";
import "./manufacturing.css";

const TITLE = "Manufacturing";
const NARROW = "(max-width: 700px)";

function useNarrow(): boolean {
    const [narrow, setNarrow] = useState(() => typeof window.matchMedia === "function" && window.matchMedia(NARROW).matches);
    useEffect(() => {
        if (typeof window.matchMedia !== "function") return;
        const m = window.matchMedia(NARROW);
        const on = () => setNarrow(m.matches);
        m.addEventListener?.("change", on);
        return () => m.removeEventListener?.("change", on);
    }, []);
    return narrow;
}

// /manufacturing: how the parts of an actuator are made, as one zoomable
// process map per chain. The chain is in the query, the focused step in the
// hash (/manufacturing#step=jet-milling).
export function Manufacturing({ menuOpen = false }: { menuOpen?: boolean }) {
    const [chainId, setChainId] = useState(() => readChain(window.location.search));
    const chain = getChain(chainId) ?? PROCESS_CHAINS[0];
    const known = useCallback((id: string) => isTarget(chainId, id), [chainId]);
    const [focus, setFocus] = useSupplyChainSelection("step", known);
    const [company, setCompany] = useState<string | null>(null);
    const narrow = useNarrow();
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => { document.title = prev; };
    }, []);
    if (!chain) return null;
    const pickChain = (id: string) => {
        setChainId(id);
        setFocus(null);
        window.history.replaceState(window.history.state, "", `${MANUFACTURING_PATH}${writeChain(window.location.search, id)}`);
    };
    const close = () => setFocus(null);
    const card = focus
        ? <StepCard chain={chain} stepId={focus} onClose={close} onStep={setFocus} onCompany={setCompany} mode={narrow ? "sheet" : "panel"} />
        : null;
    return <div className="tool-page mf-page">
        <PublicHeader path={MANUFACTURING_PATH} initialOpen={menuOpen} />
        <FootnotesProvider>
            <main className="tool-main">
                <header className="tool-head mf-head">
                    <p className="tool-kicker">Supply chain · as of {MANUFACTURING_AS_OF}</p>
                    <h1>{TITLE}</h1>
                    <p className="tool-lede">{chain.title}, ore to rotor.</p>
                    <div className="mf-switch" role="radiogroup" aria-label="Chain">
                        {PROCESS_CHAINS.map((c) => <button key={c.id} type="button" role="radio" aria-checked={c.id === chain.id} onClick={() => pickChain(c.id)}>{c.label}</button>)}
                    </div>
                </header>
                {narrow
                    ? <ClusterCards chain={chain} focusId={focus} onFocus={setFocus} />
                    : <div className="mf-stage">
                        <ProcessMap chain={chain} focusId={focus} onFocus={setFocus} />
                        {card}
                        <CompanyDrawer companyId={company} onClose={() => setCompany(null)} />
                    </div>}
                {narrow ? <>{card}<CompanyDrawer companyId={company} onClose={() => setCompany(null)} /></> : null}
                <p className="mf-foot"><a href={`${MANUFACTURING_PATH}.md`}>Read as a list</a> · <a href={`/api/v1/processes/${chain.id}`}>Get the data</a></p>
                <SourcesSection />
            </main>
        </FootnotesProvider>
        <PublicFooter />
    </div>;
}
