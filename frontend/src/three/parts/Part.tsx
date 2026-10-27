import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import type { InstancedMesh, Matrix4 } from "three";
import type {
    PartKind,
    PartPropsByKind,
    PartShape,
} from "../../../../src/supply-chain/scenes/spec";
import {
    type PartLook,
    type PartMaterials,
    applyLook,
    createMaterials,
    disposeMaterials,
} from "../scene/look";
import { buildPart } from "./index";
import { edgeLines } from "./geometry";

interface Props {
    shape: PartShape;
    look?: PartLook;
    // Exposes the materials so a loop can drive glow and fades per frame.
    materialsRef?: RefObject<PartMaterials | null>;
}

function Instanced({ geometry, matrices, material }: {
    geometry: Parameters<typeof edgeLines>[0]["geometry"];
    matrices: Matrix4[];
    material: PartMaterials["body"];
}) {
    const ref = useRef<InstancedMesh>(null);
    useLayoutEffect(() => {
        const mesh = ref.current;
        if (!mesh) return;
        matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
    }, [matrices]);
    return <instancedMesh ref={ref} args={[geometry, material, matrices.length]} />;
}

// One procedural part: faces, instanced repeats, crease edges and detail
// lines, all sharing four materials.
export function ProceduralPart({ shape, look, materialsRef }: Props) {
    const key = JSON.stringify(shape);
    // Keyed on the serialised shape: callers may pass a fresh object each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const pieces = useMemo(() => buildPart(shape), [key]);
    const edges = useMemo(() => pieces.map(edgeLines), [pieces]);
    const materials = useMemo(() => createMaterials(), []);
    useLayoutEffect(() => {
        if (materialsRef) materialsRef.current = materials;
    }, [materials, materialsRef]);
    useLayoutEffect(() => applyLook(materials, look ?? {}), [materials, look]);
    useLayoutEffect(
        () => () => {
            for (const p of pieces) p.geometry.dispose();
            for (const e of edges) e?.dispose();
        },
        [pieces, edges],
    );
    useLayoutEffect(() => () => disposeMaterials(materials), [materials]);

    return (
        <group>
            {pieces.map((p, i) => {
                const k = `${i}`;
                if (p.tone === "lines") {
                    return <lineSegments key={k} geometry={p.geometry} material={materials.line} raycast={() => null} />;
                }
                const material = p.tone === "alt" ? materials.alt : materials.body;
                return p.matrices ? (
                    <Instanced key={k} geometry={p.geometry} matrices={p.matrices} material={material} />
                ) : (
                    <mesh key={k} geometry={p.geometry} material={material} />
                );
            })}
            {edges.map((e, i) =>
                e ? (
                    <lineSegments key={`e${i}`} geometry={e} material={materials.edge} raycast={() => null} />
                ) : null,
            )}
        </group>
    );
}

type KindProps<K extends PartKind> = PartPropsByKind[K] & { look?: PartLook };

function partComponent<K extends PartKind>(component: K) {
    const C = ({ look, ...props }: KindProps<K>) => (
        <ProceduralPart shape={{ component, props } as unknown as PartShape} look={look} />
    );
    C.displayName = component;
    return C;
}

// The parametric library as named components, for scenes composed in JSX.
export const Cylinder = partComponent("cylinder");
export const Ring = partComponent("ring");
export const LaminationStack = partComponent("lamination-stack");
export const WindingCoils = partComponent("winding-coils");
export const MagnetRing = partComponent("magnet-ring");
export const SpurGear = partComponent("spur-gear");
export const PlanetaryStage = partComponent("planetary-stage");
export const Flexspline = partComponent("flexspline");
export const WaveGenerator = partComponent("wave-generator");
export const CircularSpline = partComponent("circular-spline");
export const CycloidDisc = partComponent("cycloid-disc");
export const BallScrew = partComponent("ball-screw");
export const RollerScrew = partComponent("roller-screw");
export const Bearing = partComponent("bearing");
export const Encoder = partComponent("encoder");
export const Pcb = partComponent("pcb");
export const Housing = partComponent("housing");
export const Bolt = partComponent("bolt");
