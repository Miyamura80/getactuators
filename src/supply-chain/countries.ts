// ISO 3166 alpha-2 codes the registry and share datasets use, with a rough
// bounding box (lat/lon, generous by a degree) so the registry tests can catch
// a site pinned to the wrong country or with swapped coordinates.

export interface CountryInfo {
    name: string;
    // [minLat, minLon, maxLat, maxLon]
    bbox: [number, number, number, number];
}

export const COUNTRIES = {
    AU: { name: "Australia", bbox: [-44, 112, -10, 154] },
    CN: { name: "China", bbox: [18, 73, 54, 135] },
    JP: { name: "Japan", bbox: [24, 122, 46, 146] },
    KR: { name: "South Korea", bbox: [33, 124, 39, 131] },
    MM: { name: "Myanmar", bbox: [9, 92, 29, 102] },
    TH: { name: "Thailand", bbox: [5, 97, 21, 106] },
    US: { name: "United States", bbox: [18, -180, 72, -66] },
} as const satisfies Record<string, CountryInfo>;

export type CountryCode = keyof typeof COUNTRIES;

export const COUNTRY_CODES = Object.keys(COUNTRIES) as CountryCode[];

export function countryName(code: string): string {
    return code in COUNTRIES ? COUNTRIES[code as CountryCode].name : code;
}

// Flag emoji from the two regional indicator symbols of an ISO alpha-2 code
// ("CN" -> U+1F1E8 U+1F1F3). Pair it with countryName() as the accessible label.
export function countryFlag(code: string): string {
    const upper = code.toUpperCase();
    if (!/^[A-Z]{2}$/.test(upper)) return code;
    return String.fromCodePoint(
        ...[...upper].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
    );
}

export function insideCountry(code: CountryCode, lat: number, lon: number): boolean {
    const [minLat, minLon, maxLat, maxLon] = COUNTRIES[code].bbox;
    return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
}
