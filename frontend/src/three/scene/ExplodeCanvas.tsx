// three.js objects and frame refs are mutated every frame by design (R3F).
/* eslint-disable react-hooks/immutability */
import { Html } from "@react-three/drei";
import { type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { createContext, type RefObject, useContext, useEffect, useMemo, useRef } from "react";
import { Euler, type Group, Vector3 } from "three";
import {
    explodedPosition,
    nextSelection,
    partExtent,
    partProgress,
    sceneBox,
} from "../../../../src/supply-chain/scenes/motion";
import type { ExplodeSceneSpec, PartSpec, Vec3 } from "../../../../src/supply-chain/scenes/spec";
import { ProceduralPart } from "../parts/Part";
import type { PartLook, PartState } from "./look";
import { Frame, Stage, boxCorners } from "./Stage";

export interface ExplodeCanvasProps {
    scene: ExplodeSceneSpec;
    // Target explode, 0 (assembled) .. 1 (fully exploded).
    explode: number;
    // Jump to the target instead of easing towards it.
    instant: boolean;
    visible: boolean;
    selectedId: string | null;
    hoverId: string | null;
    labels: "all" | "selected";
    onSelect: (id: string | null) => void;
    onHover: (id: string | null) => void;
    onReady?: () => void;
}

type Layout = "wide" | "tall";

// Wide frames lay the assembly axis left to right; tall ones stand it up.
const ROOT_ROTATION: Record<Layout, Euler> = {
    wide: new Euler(0, Math.PI / 2, 0),
    tall: new Euler(-Math.PI / 2, 0, 0),
};
const VIEW_DIR: Record<Layout, Vector3> = {
    wide: new Vector3(0.42, 0.34, 0.84),
    tall: new Vector3(0.62, 0.42, 0.66),
};

const ExplodeContext = createContext<RefObject<number>>({ current: 0 });

function ExplodeDriver({ target, instant }: { target: number; instant: boolean }) {
    const current = useContext(ExplodeContext);
    const invalidate = useThree((s) => s.invalidate);
    useEffect(() => {
        if (instant) current.current = target;
        invalidate();
    }, [target, instant, current, invalidate]);
    useFrame((_, dt) => {
        const gap = target - current.current;
        if (Math.abs(gap) < 1e-4) {
            current.current = target;
            return;
        }
        current.current += gap * Math.min(1, dt * 5);
        invalidate();
    });
    return null;
}

function stateOf(id: string, selectedId: string | null, hoverId: string | null): PartState {
    if (id === selectedId) return "selected";
    if (id === hoverId) return "hover";
    if (selectedId) return "dim";
    return "rest";
}

interface PartNodeProps {
    spec: PartSpec;
    index: number;
    count: number;
    stagger: number;
    layout: Layout;
    state: PartState;
    showLabel: "always" | "exploded" | "never";
    // Number only: narrow frames, where the name sits in the readout below.
    compact: boolean;
    onSelect: (id: string) => void;
    onHover: (id: string | null) => void;
}

function PartNode({ spec, index, count, stagger, layout, state, showLabel, compact, onSelect, onHover }: PartNodeProps) {
    const group = useRef<Group>(null);
    const tag = useRef<HTMLDivElement>(null);
    const explode = useContext(ExplodeContext);
    const look = useMemo<PartLook>(() => ({ state, accent: spec.accent }), [state, spec.accent]);
    const { r } = partExtent(spec);
    // Alternate callouts above and below the axis, two leader lengths deep.
    const side = index % 2 === 0 ? 1 : -1;
    const lead = index % 4 < 2 ? 26 : 58;
    const anchor: Vec3 = layout === "wide" ? [0, side * r, 0] : [side * r, 0, 0];
    const dir = layout === "wide" ? (side > 0 ? "up" : "down") : side > 0 ? "right" : "left";

    useFrame(() => {
        const t = partProgress(explode.current, index, count, stagger);
        const p = explodedPosition(spec, t);
        group.current?.position.set(p[0], p[1], p[2]);
        if (tag.current) {
            const shown = showLabel === "always" || (showLabel === "exploded" && explode.current > 0.55);
            tag.current.dataset.shown = String(shown);
        }
    });

    const click = (e: ThreeEvent<MouseEvent>) => {
        if (e.delta > 4) return;
        e.stopPropagation();
        onSelect(spec.id);
    };
    const inferred = spec.confidence !== undefined && spec.confidence !== "reported";

    return (
        <group
            ref={group}
            rotation={spec.assembled?.rotation ?? [0, 0, 0]}
            onClick={click}
            onPointerOver={(e) => {
                e.stopPropagation();
                onHover(spec.id);
                document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
                onHover(null);
                document.body.style.cursor = "";
            }}
        >
            <ProceduralPart shape={spec} look={look} />
            {showLabel !== "never" && (
                <Html position={anchor} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
                    <div ref={tag} className="x3-tag" data-dir={dir} data-state={state} style={{ ["--lead" as string]: `${lead}px` }}>
                        <span className="x3-tag-line" />
                        <span className="x3-tag-text">
                            <b>{String(index + 1).padStart(2, "0")}</b>
                            {!compact && spec.label}
                            {!compact && inferred && <i title="Inferred geometry">≈</i>}
                        </span>
                    </div>
                </Html>
            )}
        </group>
    );
}

function Scene(props: ExplodeCanvasProps) {
    const { scene, selectedId, hoverId, labels } = props;
    const size = useThree((s) => s.size);
    const layout: Layout = size.width >= size.height * 0.9 ? "wide" : "tall";
    const stagger = scene.stagger ?? 0;
    const corners = useMemo(() => {
        const box = sceneBox(scene.parts, 1, stagger);
        const rot = ROOT_ROTATION[layout];
        return boxCorners(new Vector3(...box.min), new Vector3(...box.max)).map((c) => c.applyEuler(rot));
    }, [scene, stagger, layout]);
    const select = (id: string) => props.onSelect(nextSelection(selectedId, id));
    return (
        <>
            <Frame corners={corners} dir={VIEW_DIR[layout]} />
            <ExplodeDriver target={props.explode} instant={props.instant} />
            <group rotation={ROOT_ROTATION[layout]}>
                {scene.parts.map((spec, i) => {
                    const state = stateOf(spec.id, selectedId, hoverId);
                    const showLabel =
                        state === "selected" || state === "hover"
                            ? "always"
                            : labels === "all"
                              ? "exploded"
                              : "never";
                    return (
                        <PartNode
                            key={spec.id}
                            spec={spec}
                            index={i}
                            count={scene.parts.length}
                            stagger={stagger}
                            layout={layout}
                            state={state}
                            showLabel={showLabel}
                            compact={labels === "selected"}
                            onSelect={select}
                            onHover={props.onHover}
                        />
                    );
                })}
            </group>
        </>
    );
}

// The live WebGL half of ExplodeScene. Loaded lazily: importing this module
// pulls in three.js, so only pages that render a scene pay for it.
export default function ExplodeCanvas(props: ExplodeCanvasProps) {
    const explode = useRef(props.instant ? props.explode : 0);
    return (
        <Stage
            animate={!props.instant}
            visible={props.visible}
            onReady={props.onReady}
            onPointerMissed={() => props.onSelect(null)}
        >
            <ExplodeContext.Provider value={explode}>
                <Scene {...props} />
            </ExplodeContext.Provider>
        </Stage>
    );
}
