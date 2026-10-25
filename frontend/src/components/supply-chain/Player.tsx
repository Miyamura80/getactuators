import { countryName } from "../../../../src/country-flag";
import type { DominanceMarket } from "../../../../src/supply-chain/perspective";
import { Flag } from "../Flag";

// A real, countable player: a country as its flag (named for assistive tech)
// or a company by name. `withName` adds the country name after the flag.
export function Player({ id, kind, withName = false }: {
    id: string;
    kind: DominanceMarket["kind"];
    withName?: boolean;
}) {
    if (id === "other") return <span className="sc-player is-other">Others</span>;
    if (kind === "company") return <span className="sc-player">{id}</span>;
    return <span className="sc-player">
        <Flag code={id} />
        {withName ? <span>{shortName(id)}</span> : null}
    </span>;
}

function shortName(code: string): string {
    if (code === "US") return "US";
    return countryName(code);
}
