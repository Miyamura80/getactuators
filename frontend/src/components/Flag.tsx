import { countryFlag, countryName } from "../../../src/country-flag";

// A country as its flag emoji, named for assistive tech and on hover.
// `decorative` when the surrounding element already carries the name.
export function Flag({ code, decorative = false }: { code: string; decorative?: boolean }) {
    const name = countryName(code);
    return decorative ? (
        <span className="flag" aria-hidden="true">
            {countryFlag(code)}
        </span>
    ) : (
        <span className="flag" role="img" aria-label={name} title={name}>
            {countryFlag(code)}
        </span>
    );
}
