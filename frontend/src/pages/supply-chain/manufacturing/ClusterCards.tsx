import { type ProcessChain, sharesOf, stepsIn } from "../../../../../src/supply-chain/processes";
import { PRODUCT_ID } from "../../../../../src/supply-chain/processes/layout";
import { ConcentrationBadge } from "../../../components/flows/ConcentrationBadge";
import { ProcessIconSvg, StageIconSvg } from "../../../components/flows/process-icons";
import { SourcedValue } from "../../../components/supply-chain/SourcedValue";

// Phones: the zoom levels become a vertical scroll of stage cards, each
// listing its steps; tapping a step opens its full-screen card.
export function ClusterCards({ chain, focusId, onFocus }: {
    chain: ProcessChain;
    focusId: string | null;
    onFocus: (id: string) => void;
}) {
    const productButton = <button type="button" aria-pressed={focusId === PRODUCT_ID} data-step={PRODUCT_ID} onClick={() => onFocus(PRODUCT_ID)}>
        <ProcessIconSvg icon="product" className="mf-step-icon" />
        <span className="mf-step-label">{chain.productLabel}</span>
    </button>;
    // Side-by-side sub-chains all feed the product, so it gets its own card.
    const productCard = chain.parallel ? <li className="mf-cluster-card is-product">
        <header>
            <span className="mf-cluster-n">{chain.clusters.length + 1}</span>
            <ProcessIconSvg icon="product" className="mf-stage-svg" />
            <h2>{chain.productLabel}</h2>
        </header>
        <ul><li>{productButton}</li></ul>
    </li> : null;
    return <ol className="mf-clusters">
        {chain.clusters.map((c, i) => {
            const shares = sharesOf(c.shares);
            return <li key={c.id} className="mf-cluster-card">
                <header>
                    <span className="mf-cluster-n">{i + 1}</span>
                    <StageIconSvg stage={c.stage} className="mf-stage-svg" />
                    <h2>{c.label}</h2>
                    {shares ? <ConcentrationBadge shares={shares} /> : null}
                </header>
                <ul>
                    {stepsIn(chain, c.id).map((s) => {
                        const k = s.keyNumbers[0];
                        // The cited number sits beside the button: its footnote
                        // link cannot nest inside it.
                        return <li key={s.id}>
                            <button type="button" aria-pressed={focusId === s.id} data-step={s.id} className={s.branch ? `is-${s.branch}` : undefined} onClick={() => onFocus(s.id)}>
                                <ProcessIconSvg icon={s.icon} className="mf-step-icon" />
                                <span className="mf-step-label">{s.label}</span>
                            </button>
                            {k ? <span className="mf-step-num"><SourcedValue value={k.value} /></span> : null}
                        </li>;
                    })}
                    {!chain.parallel && i === chain.clusters.length - 1 ? <li>{productButton}</li> : null}
                </ul>
            </li>;
        })}
        {productCard}
    </ol>;
}
