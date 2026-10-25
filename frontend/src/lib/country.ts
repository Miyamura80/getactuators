// The datasets store country names ("South Korea"); <Flag> takes ISO 3166-1
// alpha-2 codes. Resolve a name (or a code) to its code at render time from the
// same Intl region names the flag helper labels with, so no table is kept.

const NAMES = new Intl.DisplayNames(["en"], { type: "region" });
const A = 65;

let byName: Map<string, string> | null = null;

function index(): Map<string, string> {
    if (byName) return byName;
    byName = new Map();
    for (let i = 0; i < 26; i++) {
        for (let j = 0; j < 26; j++) {
            const code = String.fromCharCode(A + i, A + j);
            let name: string | undefined;
            try {
                name = NAMES.of(code);
            } catch {
                name = undefined;
            }
            if (name && name !== code && !byName.has(name.toLowerCase())) byName.set(name.toLowerCase(), code);
        }
    }
    return byName;
}

export function countryCode(nameOrCode: string | null | undefined): string | null {
    if (!nameOrCode) return null;
    const v = nameOrCode.trim();
    if (/^[A-Za-z]{2}$/.test(v)) return v.toUpperCase();
    return index().get(v.toLowerCase()) ?? null;
}
