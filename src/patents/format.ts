// Number formats shared by /patents, its markdown twins and the API
// markdown. Minus is ASCII "-" everywhere. No imports: the browser bundle
// reuses this module.

// A fraction as a percentage: pctText(0.1234, 1) is "12.3%".
export const pctText = (v: number, digits = 0): string =>
    `${(v * 100).toFixed(digits)}%`;

// A change as a signed whole percentage: "+12%", "-5%".
export const signedPct = (v: number): string =>
    `${v >= 0 ? "+" : "-"}${Math.abs(v * 100).toFixed(0)}%`;

// A share in a table cell: one decimal under 10%, whole above. Shares under
// 0.1% read as "<0.1%" (and zero as "0%"), or as `tiny` when given, for a
// chart cell that should stay quiet.
export function cellPct(v: number, opts: { tiny?: string } = {}): string {
    if (v < 0.001 && opts.tiny !== undefined) return opts.tiny;
    if (v === 0) return "0%";
    if (v < 0.001) return "<0.1%";
    return pctText(v, v < 0.1 ? 1 : 0);
}

// A year window: "2010-2017", or "2010-17" with short.
export const yearSpan = (
    [a, b]: readonly [number, number],
    { short = false }: { short?: boolean } = {},
): string => `${a}-${short ? String(b).slice(2) : b}`;
