import { type CountryPage, worldShares } from "../../../../../src/supply-chain/country-pages";
import { MEASURE_TYPE_LABEL, measuresForCountry } from "../../../../../src/supply-chain/policy";
import { STAGE_LABEL } from "../../../../../src/supply-chain/stages";
import { NodeBadge } from "../../../components/flows/NodeBadge";
import { FootnoteRef, SourcedValue } from "../../../components/supply-chain/SourcedValue";
import { SUPPLY_CHAIN_AS_OF } from "../../../../../src/supply-chain/registry";

const POLICY_CHIPS = 6;

// The overview strip above the map: the country's share of each stage, a
// bar for the share and the world leader's badge (one country holding half
// or more reads as dominant), then the country's newest policy measures.
export function StageStrip({ page }: { page: CountryPage }) {
    const policies = measuresForCountry(page.code);
    return <div className="cp-strip">
        <ol className="cp-stages" aria-label={`${page.name}'s share of each stage`}>
            {page.stages.map((s) => {
                const world = worldShares(s.stage);
                return <li key={s.stage} className="cp-stage" data-stage={s.stage}>
                    <span className="cp-stage-name">{STAGE_LABEL[s.stage]}</span>
                    <span className="cp-stage-share">
                        {s.share ? <SourcedValue value={s.share} /> : <span className="cp-gap">no split<FootnoteRef sources={s.gap?.sources ?? []} asOf={SUPPLY_CHAIN_AS_OF} confidence="reported" note={s.gap?.text} /></span>}
                    </span>
                    <span className="cp-stage-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, (s.share?.value ?? 0) * 100)}%` }} /></span>
                    <span className="cp-stage-of">of {s.of}</span>
                    {world ? <span className="cp-stage-world">World leader <NodeBadge kind="concentration" shares={world} /></span> : null}
                </li>;
            })}
        </ol>
        {policies.length ? <div className="cp-policies">
            <span className="cp-policies-label">Policy</span>
            {policies.slice(0, POLICY_CHIPS).map((m) => <a key={m.id} className="cp-policy" href={`/policy#measure=${m.id}`} title={`${MEASURE_TYPE_LABEL[m.type]}: ${m.summary}`}>{m.title}</a>)}
            <a className="cp-policy is-more" href="/policy">All {policies.length} on /policy</a>
        </div> : null}
    </div>;
}
