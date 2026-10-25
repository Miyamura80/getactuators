import { LEVEL_LABEL, type Concentration } from "../../../../src/supply-chain/concentration";
import { percent } from "../../../../src/supply-chain/format";

// "Is this stage monopolized?" at a glance: Infra Red outline when one
// country holds 70% or more, Circuit Green when spread out, grey between.
export function ConcentrationBadge({ level, top, hhi }: {
    level: Concentration["level"];
    top?: Concentration["top"];
    hhi?: number;
}) {
    const detail = hhi === undefined ? undefined : `HHI ${hhi.toLocaleString("en-US")}`;
    return <span className={`sc-badge sc-badge-${level}`} title={detail}>
        <b>{LEVEL_LABEL[level]}</b>
        {top ? <span>{top.country} {percent(top.share)}</span> : null}
    </span>;
}
