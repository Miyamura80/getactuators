import { countryFlag, countryName } from "../../../../src/supply-chain/countries";

// A country as its flag emoji, named for assistive tech. `decorative` when
// the surrounding element already carries the country name.
export function Flag({ code, decorative = false }: { code: string; decorative?: boolean }) {
    const name = countryName(code);
    return decorative
        ? <span className="sc-flag" aria-hidden="true">{countryFlag(code)}</span>
        : <span className="sc-flag" role="img" aria-label={name} title={name}>{countryFlag(code)}</span>;
}
