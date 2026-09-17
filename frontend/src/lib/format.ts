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
