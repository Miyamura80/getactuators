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
    CD: { bbox: [-14, 11, 6, 32] },
    CN: { bbox: [18, 73, 54, 135] },
    ID: { bbox: [-12, 94, 7, 142] },
    JP: { bbox: [24, 122, 46, 146] },
    KR: { bbox: [33, 124, 39, 131] },
    MM: { bbox: [9, 92, 29, 102] },
    TH: { bbox: [5, 97, 21, 106] },
    US: { bbox: [18, -180, 72, -66] },
    FR: { bbox: [41, -6, 52, 10] },
    IN: { bbox: [6, 68, 36, 98] },
    TW: { bbox: [21, 119, 26.5, 123] },
    DE: { bbox: [47, 5, 55.5, 15.5] },
    CH: { bbox: [45.5, 5.5, 48, 10.7] },
    CA: { bbox: [41, -141, 84, -52] },
    GB: { bbox: [49, -9, 61, 2.5] },
} as const satisfies Record<string, CountryInfo>;

export type CountryCode = keyof typeof COUNTRIES;

export const COUNTRY_CODES = Object.keys(COUNTRIES) as CountryCode[];

export function insideCountry(code: CountryCode, lat: number, lon: number): boolean {
    const [minLat, minLon, maxLat, maxLon] = COUNTRIES[code].bbox;
    return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
}
