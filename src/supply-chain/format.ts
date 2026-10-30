import type { Sourced } from "./sourced";

// Value formatting shared by the React kit and the markdown twins, so a number
// reads the same in both.

interface Scale {
    div: number;
    prefix: string;
    suffix: string;
}

function trim(n: number): string {
    const digits = Math.abs(n) >= 100 ? 1 : Math.abs(n) >= 10 ? 1 : 2;
    return Number(n.toFixed(digits)).toString();
}

// Steps from largest to smallest: [divisor, suffix].
type Steps = [number, string][];
const STEPS: Record<string, { prefix: string; steps: Steps }> = {
    USD: {
        prefix: "$",
        steps: [
            [1e9, "B"],
            [1e6, "M"],
            [1e3, "k"],
            [1, ""],
        ],
    },
    t: {
        prefix: "",
        steps: [
            [1e6, " Mt"],
            [1e3, " kt"],
            [1, " t"],
        ],
    },
    "t/yr": {
        prefix: "",
        steps: [
            [1e6, " Mt/yr"],
            [1e3, " kt/yr"],
            [1, " t/yr"],
        ],
    },
    units: {
        prefix: "",
        steps: [
            [1e6, "M"],
            [1e3, "k"],
            [1, ""],
        ],
    },
};

function scaleFor(unit: string | undefined, max: number): Scale {
    if (unit === "fraction") return { div: 0.01, prefix: "", suffix: "%" };
    const table = unit ? STEPS[unit] : undefined;
    if (!table) return { div: 1, prefix: "", suffix: unit ? ` ${unit}` : "" };
    const m = Math.abs(max);
    const [div, suffix] = table.steps.find(([d]) => m >= d) ??
        table.steps.at(-1) ?? [1, ""];
    return { div, prefix: table.prefix, suffix };
}

function plain(unit: string | undefined, n: number): string {
    if (unit === "year") return String(Math.round(n));
    if (unit === "HHI") return Math.round(n).toLocaleString("en-US");
    if (unit === "fraction") return `${Math.round(n * 100)}`;
    return trim(n);
}

// "224.4M"-style text for a value, or "5.8-6B" for a range.
export function formatValue(
    value: number,
    unit?: string,
    range?: [number, number],
): string {
    if (unit === "year" || unit === "HHI") {
        const s = scaleFor(undefined, value);
        const body = range
            ? `${plain(unit, range[0])}-${plain(unit, range[1])}`
            : plain(unit, value);
        return `${body}${unit === "HHI" ? "" : s.suffix}`;
    }
    const max = range ? Math.max(Math.abs(range[0]), Math.abs(range[1])) : value;
    const s = scaleFor(unit, max);
    const f = (n: number) => {
        if (unit === "fraction") return plain(unit, n);
        if (unit === "units") return Number((n / s.div).toFixed(1)).toString();
        return trim(n / s.div);
    };
    const body = range ? `${f(range[0])}-${f(range[1])}` : f(value);
    return `${s.prefix}${body}${s.suffix}`;
}

export function formatSourced(s: Sourced<number>): string {
    return formatValue(s.value, s.unit, s.range);
}

// Plain-text form used in markdown: "~" marks an estimate, "(model)" a model.
export function sourcedText(s: Sourced<number>): string {
    const text = formatSourced(s);
    if (s.confidence === "estimated") return `~${text}`;
    if (s.confidence === "modeled") return `${text} (model)`;
    return text;
}

export function percent(share: number): string {
    return `${Math.round(share * 100)}%`;
}

// "4.2%": a share with a fixed number of decimals, trailing zeros dropped.
export function percentDigits(share: number, digits = 1): string {
    return `${Number((share * 100).toFixed(digits))}%`;
}
