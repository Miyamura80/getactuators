import { type KeyboardEvent, useMemo } from "react";
import { geoPath, type GeoProjection } from "d3-geo";
import type { GeoFeature } from "./geo";

export interface GeoLayerProps {
    features: GeoFeature[];
    projection: GeoProjection;
    idOf: (f: GeoFeature) => string;
    nameOf: (f: GeoFeature) => string;
    // Choropleth step per feature id (0 = no data).
    stepOf?: (id: string) => number;
    activeId?: string | null;
    selectedId?: string | null;
    // Features in this set are focusable buttons when `onSelect` is given.
    selectable?: (id: string) => boolean;
    onSelect?: (id: string) => void;
    onHover?: (id: string | null) => void;
}

// Land outlines (countries or admin-1 regions), optionally shaded. Strokes do
// not scale with zoom, so outlines stay hairline at every level.
export function GeoLayer({ features, projection, idOf, nameOf, stepOf, activeId, selectedId, selectable, onSelect, onHover }: GeoLayerProps) {
    const shapes = useMemo(() => {
        const path = geoPath(projection);
        return features.map((f, i) => ({ key: `${idOf(f) || "x"}-${i}`, id: idOf(f), name: nameOf(f), d: path(f) ?? "" }));
    }, [features, projection, idOf, nameOf]);
    return <g className="mk-geo">
        {shapes.map((s) => {
            const step = stepOf?.(s.id) ?? 0;
            const interactive = !!onSelect && !!s.id && (selectable?.(s.id) ?? true);
            const cls = `mk-land${s.id && s.id === activeId ? " is-active" : ""}${s.id && s.id === selectedId ? " is-selected" : ""}`;
            return <path
                key={s.key}
                d={s.d}
                className={cls}
                data-id={s.id || undefined}
                data-step={step || undefined}
                onPointerEnter={onHover && s.id ? () => onHover(s.id) : undefined}
                onPointerLeave={onHover ? () => onHover(null) : undefined}
                {...(interactive ? {
                    role: "button",
                    tabIndex: 0,
                    "aria-label": s.name,
                    "aria-pressed": s.id === selectedId,
                    onClick: () => onSelect?.(s.id),
                    onFocus: () => onHover?.(s.id),
                    onBlur: () => onHover?.(null),
                    onKeyDown: (e: KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(s.id); }
                    },
                } : {})}
            />;
        })}
    </g>;
}
