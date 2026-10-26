const DASH = "–"; // en dash placeholder for missing values (never an em dash, per repo + user convention)

export function dash(): string {
    return DASH;
}

export function num(v: number | null | undefined, dp = 0): string {
    if (v == null || Number.isNaN(v)) return DASH;
    return v.toLocaleString("en-US", {
        minimumFractionDigits: dp,
        maximumFractionDigits: dp,
    });
}

export function price(v: number | null | undefined): string {
    if (v == null) return "Quote";
    return `$${num(v)}`;
}

export function voltage(v: string | number | null | undefined): string {
    if (v == null || v === "") return DASH;
    return `${v} V`;
}

export function list(v: string[] | null | undefined): string {
    if (!v || v.length === 0) return DASH;
    return v.join(", ");
}

export function bool(v: boolean | null | undefined): string {
    if (v == null) return DASH;
    return v ? "Yes" : "No";
}

// Compact USD for chart labels: $399, $3.5k, $70k.
export function usdShort(v: number): string {
    if (v >= 10_000) return `$${Math.round(v / 1000)}k`;
    if (v >= 1000) return `$${Number((v / 1000).toFixed(1))}k`;
    return `$${Math.round(v)}`;
}

export function hours(v: number): string {
    return `${Number.isInteger(v) ? v : v.toFixed(1)} h`;
}
