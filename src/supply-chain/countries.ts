// ISO 3166 alpha-2 codes the registry and share datasets use (names and
// flags come from src/country-flag.ts), each with a rough
// bounding box (lat/lon, generous by a degree) so the registry tests can catch
// a site pinned to the wrong country or with swapped coordinates.

export interface CountryInfo {
    // [minLat, minLon, maxLat, maxLon]
    bbox: [number, number, number, number];
}

export const COUNTRIES = {
    AU: { bbox: [-44, 112, -10, 154] },
    CN: { bbox: [18, 73, 54, 135] },
    JP: { bbox: [24, 122, 46, 146] },
    KR: { bbox: [33, 124, 39, 131] },
    MM: { bbox: [9, 92, 29, 102] },
    TH: { bbox: [5, 97, 21, 106] },
    US: { bbox: [18, -180, 72, -66] },
} as const satisfies Record<string, CountryInfo>;

export type CountryCode = keyof typeof COUNTRIES;

export const COUNTRY_CODES = Object.keys(COUNTRIES) as CountryCode[];

export function insideCountry(code: CountryCode, lat: number, lon: number): boolean {
    const [minLat, minLon, maxLat, maxLon] = COUNTRIES[code].bbox;
    return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
}
