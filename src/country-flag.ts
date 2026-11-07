// Countries are shown site-wide as flag emoji with the name as the accessible
// label. Codes are ISO 3166-1 alpha-2; names come from Intl so no table is kept.

const NAMES = new Intl.DisplayNames(["en"], { type: "region" });

// "CN" -> U+1F1E8 U+1F1F3. Anything that is not a two-letter code is returned
// unchanged so a bad value stays visible instead of rendering as a blank.
export function countryFlag(code: string): string {
    const upper = code.toUpperCase();
    if (!/^[A-Z]{2}$/.test(upper)) return code;
    return String.fromCodePoint(
        ...[...upper].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
    );
}

export function countryName(code: string): string {
    try {
        return NAMES.of(code.toUpperCase()) ?? code;
    } catch {
        return code;
    }
}
