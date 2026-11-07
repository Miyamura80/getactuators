import { countryCode } from "../lib/country";
import { Flag } from "./Flag";

// A dataset country name ("South Korea") as its flag, named on hover and for
// assistive tech. Renders nothing for an unknown or missing country.
export function CountryFlag({ country, decorative = false }: { country: string | null | undefined; decorative?: boolean }) {
    const code = countryCode(country);
    return code ? <Flag code={code} decorative={decorative} /> : null;
}
