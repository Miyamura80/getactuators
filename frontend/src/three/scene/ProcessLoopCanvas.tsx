// three.js objects and frame refs are mutated every frame by design (R3F).
/* eslint-disable react-hooks/immutability */
import { useFrame } from "@react-three/fiber";
import { useContext, useMemo, useRef } from "react";
import { type Group, Vector3 } from "three";
import { activeStep, loopPhase, sampleTrack } from "../../../../src/supply-chain/scenes/motion";
import type { LoopActor, ProcessLoopSpec } from "../../../../src/supply-chain/scenes/spec";
import { ProceduralPart } from "../parts/Part";
import { FieldLines, Particles, PhaseContext, loopCorners } from "./fields";
import { type PartMaterials, applyLook } from "./look";
import { Frame, Stage } from "./Stage";

export interface ProcessLoopCanvasProps {
    loop: ProcessLoopSpec;
    playing: boolean;
    // Hold the poster frame; no clock.
    still: boolean;
    visible: boolean;
    onStep?: (index: number) => void;
    onReady?: () => void;
}

function Clock({ loop, playing, still, onStep }: Pick<ProcessLoopCanvasProps, "loop" | "playing" | "still" | "onStep">) {
    const phase = useContext(PhaseContext);
    const seconds = useRef((loop.posterAt ?? 0) * loop.duration);
    const step = useRef(-2);
    useFrame((_, dt) => {
        if (!still && playing) seconds.current += Math.min(dt, 0.1);
        phase.current = still ? (loop.posterAt ?? 0.5) : loopPhase(seconds.current, loop.duration);
        const s = activeStep(loop.steps, phase.current);
        if (s !== step.current) {
            step.current = s;
            onStep?.(s);
        }
    }, -2);
    return null;
}

function Actor({ actor }: { actor: LoopActor }) {
    const group = useRef<Group>(null);
    const materials = useRef<PartMaterials | null>(null);
    const phase = useContext(PhaseContext);
    const look = useMemo(() => ({ accent: actor.accent }), [actor.accent]);
    useFrame(() => {
        const s = sampleTrack(actor.track, phase.current, actor.assembled);
        const g = group.current;
        if (!g) return;
        g.position.set(...s.position);
        g.rotation.set(...s.rotation);
        g.scale.setScalar(s.scale);
        if (materials.current) applyLook(materials.current, { accent: actor.accent, glow: s.value, opacity: s.opacity });
    });
    return (
        <group ref={group}>
            <ProceduralPart shape={actor} look={look} materialsRef={materials} />
        </group>
    );
}

const VIEW = new Vector3(0.5, 0.42, 0.76);

// The live WebGL half of ProcessLoop: actors on keyframe tracks plus field
// line and particle helpers, all driven from one looping phase.
export default function ProcessLoopCanvas(props: ProcessLoopCanvasProps) {
    const { loop } = props;
    const phase = useRef(loop.posterAt ?? 0);
    const corners = useMemo(() => loopCorners(loop), [loop]);
    return (
        <Stage animate={!props.still && props.playing} visible={props.visible} onReady={props.onReady}>
            <PhaseContext.Provider value={phase}>
                <Clock loop={loop} playing={props.playing} still={props.still} onStep={props.onStep} />
                <Frame corners={corners} dir={VIEW} margin={0.86} />
                {loop.actors.map((a) => (
                    <Actor key={a.id} actor={a} />
                ))}
                {(loop.fields ?? []).map((f) => (
                    <FieldLines key={f.id} spec={f} still={props.still} />
                ))}
                {(loop.particles ?? []).map((p) => (
                    <Particles key={p.id} spec={p} />
                ))}
            </PhaseContext.Provider>
        </Stage>
    );
}
