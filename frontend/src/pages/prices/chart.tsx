import { useEffect, useRef, useState } from "react";
import { type Scale, makeScale, tickLabel, yearTicks } from "../trends/scale";

// Shared frame for the /prices charts. Charts draw at their container's real
// width (not a scaled viewBox), so axis text stays legible on a phone and the
// left padding always fits the widest tick label.

export function useWidth(fallback = 640): [React.RefObject<HTMLDivElement | null>, number] {
    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(fallback);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const read = () => {
            const w = el.getBoundingClientRect().width;
            if (w > 0) setWidth(Math.round(w));
        };
        read();
        if (typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(read);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    return [ref, width];
}

// Mono 10px digits are ~6.1px wide; pad for the widest label plus a gap.
export function labelPad(labels: string[], min = 28): number {
    return Math.max(min, Math.max(0, ...labels.map((l) => l.length)) * 6.2 + 10);
}

export interface Frame {
    w: number;
    h: number;
    pad: { l: number; r: number; t: number; b: number };
    x: (v: number) => number;
    y: Scale;
    xTicks: number[];
}

export function frame(opts: {
    width: number;
    height: number;
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    log: boolean;
    yLabel?: (v: number) => string;
}): Frame {
    const probe = makeScale(opts.y0, opts.y1, 0, 1, opts.log);
    const fmt = opts.yLabel ?? tickLabel;
    const pad = { l: labelPad(probe.ticks.map(fmt)), r: 12, t: 10, b: 26 };
    const y = makeScale(opts.y0, opts.y1, opts.height - pad.b, pad.t, opts.log);
    const span = opts.x1 - opts.x0 || 1;
    const x = (v: number) => pad.l + ((v - opts.x0) / span) * (opts.width - pad.l - pad.r);
    const every = opts.width < 480 ? 2 : 1;
    const xTicks = yearTicks(opts.x0, opts.x1).filter((_, i) => i % every === 0);
    return { w: opts.width, h: opts.height, pad, x, y, xTicks };
}

export function Axes({ f, yLabel = tickLabel }: { f: Frame; yLabel?: (v: number) => string }) {
    return (
        <g>
            {f.y.ticks.map((t) => (
                <g key={`y${t}`}>
                    <line x1={f.pad.l} x2={f.w - f.pad.r} y1={f.y.at(t)} y2={f.y.at(t)} className="tr-grid" />
                    <text x={f.pad.l - 6} y={f.y.at(t) + 3} textAnchor="end" className="tr-axis">
                        {yLabel(t)}
                    </text>
                </g>
            ))}
            {f.xTicks.map((t) => (
                <text key={`x${t}`} x={f.x(t)} y={f.h - f.pad.b + 16} textAnchor="middle" className="tr-axis">
                    {t}
                </text>
            ))}
        </g>
    );
}

export const money = (v: number): string =>
    v >= 1000 ? `$${Math.round(v).toLocaleString("en-US")}` : v >= 100 ? `$${Math.round(v)}` : `$${v.toFixed(2)}`;

export const pct = (v: number): string => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;
