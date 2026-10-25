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

function scaleFor(unit: string | undefined, max: number): Scale {
    const m = Math.abs(max);
    switch (unit) {
        case "USD":
            if (m >= 1e9) return { div: 1e9, prefix: "$", suffix: "B" };
            if (m >= 1e6) return { div: 1e6, prefix: "$", suffix: "M" };
            if (m >= 1e3) return { div: 1e3, prefix: "$", suffix: "k" };
            return { div: 1, prefix: "$", suffix: "" };
        case "t":
        case "t/yr": {
            const per = unit === "t/yr" ? "/yr" : "";
            if (m >= 1e6) return { div: 1e6, prefix: "", suffix: ` Mt${per}` };
            if (m >= 1e3) return { div: 1e3, prefix: "", suffix: ` kt${per}` };
            return { div: 1, prefix: "", suffix: ` t${per}` };
        }
        case "fraction":
            return { div: 0.01, prefix: "", suffix: "%" };
        default:
            return { div: 1, prefix: "", suffix: unit ? ` ${unit}` : "" };
    }
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
    const f = (n: number) => (unit === "fraction" ? plain(unit, n) : trim(n / s.div));
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
