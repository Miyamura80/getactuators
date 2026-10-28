import { useEffect, useMemo } from "react";
import { type LabelItem, type Rect, labelSize, placeLabels } from "./labels";
import { useMap } from "./map-context";

// Registers an overlay's label candidates with its frame. The signature keeps
// the effect from firing (and the frame from re-rendering) unless a label or
// its screen position actually changed.
export function useMapLabels(source: string, items: LabelItem[]): void {
    const { setLabels } = useMap();
    const sig = items.map((i) => `${i.id}:${i.text}:${i.priority}:${i.at[0].toFixed(1)},${i.at[1].toFixed(1)}`).join("|");
    // `sig` stands in for `items`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { setLabels(source, items); }, [source, sig, setLabels]);
    useEffect(() => () => setLabels(source, []), [source, setLabels]);
}

// The frame's one label layer: every source placed together, decorative only
// (each marker already carries its full accessible name).
export function LabelLayer({ sets, width, height, scale, reserved }: {
    sets: Record<string, LabelItem[]>;
    width: number;
    height: number;
    scale: number;
    reserved: readonly Rect[];
}) {
    const items = useMemo(() => Object.values(sets).flat(), [sets]);
    const placed = useMemo(() => placeLabels(items, width, height, scale, reserved), [items, width, height, scale, reserved]);
    const dots = items.filter((i) => i.dot);
    if (!items.length) return null;
    const W = width * scale;
    const H = height * scale;
    const pctX = (x: number) => `${(x / W) * 100}%`;
    const pctY = (y: number) => `${(y / H) * 100}%`;
    return <div className="mk-labels" aria-hidden="true">
        {dots.map((d) => <i key={d.id} className={`mk-city-dot${d.dot === "capital" ? " is-capital" : ""}`}
            style={{ left: `${(d.at[0] / width) * 100}%`, top: `${(d.at[1] / height) * 100}%` }} />)}
        {placed.map(({ item, side }) => {
            const [w, h] = labelSize(item);
            const x = item.at[0] * scale;
            const y = item.at[1] * scale;
            const gap = item.r + 3;
            const left = side === "right" ? x + gap : side === "left" ? x - gap - w : x - w / 2;
            const top = side === "top" ? y - gap - h : side === "bottom" ? y + gap : y - h / 2;
            return <span key={item.id} className={`mk-label is-${item.tone} is-${side}`} data-label={item.id}
                style={{ left: pctX(left), top: pctY(top), width: w, height: h, lineHeight: `${h}px` }}>{item.text}</span>;
        })}
    </div>;
}
