import { Suspense, lazy, useCallback, useEffect, useId, useRef, useState } from "react";
import { nextSelection } from "../../../src/supply-chain/scenes/motion";
import type { PartSpec } from "../../../src/supply-chain/scenes/spec";
import { AssembledIcon, CubeIcon, ExplodedIcon, Poster, posterUrl } from "./kit-ui";
import { claimLive, hasWebGL, useInView, useLiveSlot, useReducedMotion, useScrollProgress } from "./support";
import "./three.css";

const ExplodeCanvas = lazy(() => import("./scene/ExplodeCanvas"));

export interface ExplodeSceneProps {
    // Stable scene id: names the poster (/posters/<id>.png).
    id: string;
    title: string;
    parts: PartSpec[];
    // Share of the explode by which each part lags the previous one.
    stagger?: number;
    // Controlled explode 0..1; leave undefined to let the scene own it.
    explode?: number;
    defaultExplode?: number;
    onExplodeChange?: (value: number) => void;
    // What moves the explode: the slider, page scroll, or both (scroll until
    // the viewer takes the slider).
    drive?: "slider" | "scroll" | "both";
    // Controlled selection; leave undefined to let the scene own it.
    selectedId?: string | null;
    onSelectPart?: (id: string | null) => void;
    // A part to light up from outside (hovering a Sankey node).
    highlightId?: string | null;
    onHoverPart?: (id: string | null) => void;
    // "auto": every label on wide frames, only the selected one on phones.
    labels?: "auto" | "all" | "selected";
    poster?: string;
    className?: string;
}

function useWide(ref: React.RefObject<HTMLElement | null>): boolean {
    const [wide, setWide] = useState(true);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const check = () => setWide(el.clientWidth >= 640);
        check();
        if (typeof ResizeObserver !== "function") return;
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, [ref]);
    return wide;
}

// An assembly that pulls apart along its axis. The resting page shows a
// poster; the WebGL chunk loads only when the scene scrolls into view and
// the browser has WebGL. Under reduced motion it sits at the exploded end
// state and never animates.
export function ExplodeScene(props: ExplodeSceneProps) {
    const { id, title, parts } = props;
    const root = useRef<HTMLElement>(null);
    const key = `${id}:${useId()}`;
    const reduced = useReducedMotion();
    const gl = hasWebGL();
    const { visible, seen } = useInView(root);
    const live = useLiveSlot(key, gl && seen);
    const wide = useWide(root);
    const [ready, setReady] = useState(false);

    // Reduced motion opens at the exploded end state; the slider still moves
    // it, instantly.
    const [ownExplode, setOwnExplode] = useState(reduced ? 1 : (props.defaultExplode ?? 1));
    const explode = props.explode ?? ownExplode;
    const { onExplodeChange } = props;
    const setExplode = useCallback(
        (v: number) => {
            setOwnExplode(v);
            onExplodeChange?.(v);
        },
        [onExplodeChange],
    );
    const drive = props.drive ?? "slider";
    const [manual, setManual] = useState(false);
    useScrollProgress(root, !reduced && (drive === "scroll" || (drive === "both" && !manual)), setExplode);

    const [ownSelected, setOwnSelected] = useState<string | null>(null);
    const selectedId = props.selectedId !== undefined ? props.selectedId : ownSelected;
    const select = (next: string | null) => {
        setOwnSelected(next);
        props.onSelectPart?.(next);
    };
    const [hoverId, setHoverId] = useState<string | null>(null);
    const hover = (h: string | null) => {
        setHoverId(h);
        props.onHoverPart?.(h);
    };
    const labels = props.labels === "auto" || !props.labels ? (wide ? "all" : "selected") : props.labels;
    const poster = <Poster src={props.poster ?? posterUrl(id)} alt={`${title}, exploded view`} />;
    const selected = parts.find((p) => p.id === selectedId);

    return (
        <figure
            ref={root}
            className={`x3${props.className ? ` ${props.className}` : ""}`}
            data-mode={live ? "live" : "poster"}
            data-motion={reduced ? "reduced" : "full"}
            data-ready={live && ready ? "true" : "false"}
            aria-label={title}
            onKeyDown={(e) => {
                if (e.key === "Escape" && selectedId) select(null);
            }}
        >
            <div className="x3-stage">
                {live ? (
                    <Suspense fallback={poster}>
                        <ExplodeCanvas
                            scene={{ id, title, parts, stagger: props.stagger }}
                            explode={explode}
                            instant={reduced}
                            visible={visible}
                            selectedId={selectedId}
                            hoverId={props.highlightId ?? hoverId}
                            labels={labels}
                            onSelect={select}
                            onHover={hover}
                            onReady={() => setReady(true)}
                        />
                    </Suspense>
                ) : (
                    poster
                )}
                {!live && gl && (
                    <button type="button" className="x3-wake" aria-label={`Show ${title} in 3D`} onClick={() => claimLive(key)}>
                        <CubeIcon />
                    </button>
                )}
            </div>
            <div className="x3-bar">
                {live && drive !== "scroll" && (
                    <label className="x3-slider">
                        <AssembledIcon />
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={explode}
                            aria-label="Explode"
                            aria-valuetext={`${Math.round(explode * 100)}% exploded`}
                            onChange={(e) => {
                                setManual(true);
                                setExplode(Number(e.currentTarget.value));
                            }}
                        />
                        <ExplodedIcon />
                    </label>
                )}
                <div className="x3-parts" role="toolbar" aria-label="Parts">
                    {parts.map((p, i) => (
                        <button
                            key={p.id}
                            type="button"
                            className="x3-chip"
                            aria-pressed={p.id === selectedId}
                            aria-label={p.label}
                            title={p.label}
                            data-accent={p.accent ? "true" : undefined}
                            onClick={() => select(nextSelection(selectedId, p.id))}
                            onPointerEnter={() => hover(p.id)}
                            onPointerLeave={() => hover(null)}
                        >
                            {String(i + 1).padStart(2, "0")}
                        </button>
                    ))}
                </div>
                <output className="x3-readout" aria-live="polite">
                    {selected?.label ?? ""}
                </output>
            </div>
        </figure>
    );
}
