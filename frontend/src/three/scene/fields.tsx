// three.js objects and frame refs are mutated every frame by design (R3F).
/* eslint-disable react-hooks/immutability */
import { useFrame } from "@react-three/fiber";
import { createContext, type RefObject, useContext, useLayoutEffect, useMemo, useRef } from "react";
import {
    Box3,
    BoxGeometry,
    BufferGeometry,
    CatmullRomCurve3,
    Euler,
    Line,
    LineDashedMaterial,
    type InstancedMesh,
    Matrix4,
    MeshLambertMaterial,
    Quaternion,
    Vector3,
} from "three";
import { partExtent, sampleTrack } from "../../../../src/supply-chain/scenes/motion";
import type {
    Axis,
    FieldLinesSpec,
    ParticlesSpec,
    ProcessLoopSpec,
    Vec3,
} from "../../../../src/supply-chain/scenes/spec";
import { boxCorners } from "./Stage";
import { INK } from "./look";

// Helpers for ProcessLoop: field lines, particles and the loop's framing box.

export const PhaseContext = createContext<RefObject<number>>({ current: 0 });

const AXIS: Record<Axis, Vector3> = {
    x: new Vector3(1, 0, 0),
    y: new Vector3(0, 1, 0),
    z: new Vector3(0, 0, 1),
};

// Rotation taking +Y (how lines and needles are authored) onto `axis`.
const toAxis = (axis: Axis = "y") => new Quaternion().setFromUnitVectors(AXIS.y, AXIS[axis]);

// Closed solenoid-style loops: straight through the bore, returning outside.
function fieldCurves(spec: FieldLinesSpec): Vector3[][] {
    const out: Vector3[][] = [];
    const h = spec.length / 2;
    const q = toAxis(spec.axis);
    const c = new Vector3(...(spec.center ?? [0, 0, 0]));
    for (let k = 0; k < spec.count; k++) {
        const a = (k / spec.count) * Math.PI * 2;
        const tier = k % 3;
        if (spec.kind === "radial") {
            const p = (r: number) => new Vector3(r * Math.cos(a), 0, r * Math.sin(a)).applyQuaternion(q).add(c);
            out.push([p(spec.radius * 0.2), p(spec.radius * (1.2 + tier * 0.25))]);
            continue;
        }
        const ri = spec.radius * (0.12 + tier * 0.12);
        const ro = spec.radius * (1.3 + tier * 0.22);
        const pts: [number, number][] = [
            [ri, -h * 0.45],
            [ri, h * 0.45],
            [(ri + ro) / 2, h * (0.62 + tier * 0.08)],
            [ro, h * 0.3],
            [ro, -h * 0.3],
            [(ri + ro) / 2, -h * (0.62 + tier * 0.08)],
        ];
        const curve = new CatmullRomCurve3(
            pts.map(([r, y]) => new Vector3(r * Math.cos(a), y, r * Math.sin(a)).applyQuaternion(q).add(c)),
            true,
        );
        out.push(curve.getPoints(80));
    }
    return out;
}

export function FieldLines({ spec, still }: { spec: FieldLinesSpec; still: boolean }) {
    const phase = useContext(PhaseContext);
    const flow = useRef(0);
    const material = useMemo(
        () => new LineDashedMaterial({ color: INK.edge, dashSize: 5, gapSize: 3, transparent: true }),
        [],
    );
    const lines = useMemo(
        () =>
            fieldCurves(spec).map((pts) => {
                const line = new Line(new BufferGeometry().setFromPoints(pts), material);
                line.computeLineDistances();
                line.userData.base = Float32Array.from(line.geometry.getAttribute("lineDistance").array);
                line.raycast = () => {};
                return line;
            }),
        [spec, material],
    );
    useLayoutEffect(
        () => () => {
            for (const l of lines) l.geometry.dispose();
            material.dispose();
        },
        [lines, material],
    );
    useFrame((_, dt) => {
        const s = sampleTrack(spec.track, phase.current);
        material.opacity = s.opacity * 0.6;
        material.visible = s.opacity > 0.01;
        // Dashes flow along the field direction: shift every line's
        // distance attribute instead of re-measuring.
        if (still || !material.visible) return;
        flow.current += dt * 14;
        for (const l of lines) {
            const attr = l.geometry.getAttribute("lineDistance");
            const base = l.userData.base as Float32Array;
            for (let i = 0; i < base.length; i++) attr.setX(i, (base[i] as number) - flow.current);
            attr.needsUpdate = true;
        }
    });
    return (
        <group>
            {lines.map((l) => (
                <primitive key={l.uuid} object={l} />
            ))}
        </group>
    );
}

// Seeded so posters and live frames show the same powder.
function rng(seed: number) {
    let s = seed >>> 0 || 1;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 2 ** 32;
    };
}

const tmpM = new Matrix4();
const tmpQ = new Quaternion();
const tmpP = new Vector3();
const ONE = new Vector3(1, 1, 1);

export function Particles({ spec }: { spec: ParticlesSpec }) {
    const phase = useContext(PhaseContext);
    const ref = useRef<InstancedMesh>(null);
    const size = Math.min(...spec.size);
    const geometry = useMemo(() => new BoxGeometry(size * 0.04, size * 0.16, size * 0.04), [size]);
    const material = useMemo(() => new MeshLambertMaterial({ color: INK.accent, transparent: true }), []);
    const seeds = useMemo(() => {
        const r = rng(spec.seed ?? 1);
        return Array.from({ length: spec.count }, () => ({
            u: new Vector3(r() - 0.5, r() - 0.5, r() - 0.5),
            q: new Quaternion().setFromAxisAngle(
                new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(),
                r() * Math.PI * 2,
            ),
            speed: 0.6 + r(),
        }));
    }, [spec.count, spec.seed]);
    const aligned = useMemo(() => toAxis(spec.axis), [spec.axis]);
    const axis = AXIS[spec.axis ?? "y"];
    useLayoutEffect(
        () => () => {
            geometry.dispose();
            material.dispose();
        },
        [geometry, material],
    );
    useFrame((state) => {
        const mesh = ref.current;
        if (!mesh) return;
        const s = sampleTrack(spec.track, phase.current);
        material.opacity = s.opacity;
        material.visible = s.opacity > 0.01;
        const center = new Vector3(...(spec.center ?? [0, 0, 0])).add(new Vector3(...s.position));
        const t = state.clock.elapsedTime;
        seeds.forEach((p, i) => {
            tmpP.set(p.u.x * spec.size[0], p.u.y * spec.size[1], p.u.z * spec.size[2]);
            // Compaction acts along the field axis only.
            const along = tmpP.dot(axis);
            tmpP.addScaledVector(axis, along * (s.scale - 1));
            if (spec.mode === "swirl") tmpP.applyAxisAngle(axis, t * p.speed * s.value * 2);
            if (spec.mode === "fall") {
                const fall = (((p.u.y + 0.5 - t * 0.3 * p.speed * s.value) % 1) + 1) % 1 - 0.5;
                tmpP.addScaledVector(axis, (fall - p.u.y) * spec.size[1]);
            }
            tmpQ.copy(p.q).slerp(aligned, spec.mode === "align" ? s.value : 0);
            tmpM.compose(tmpP.add(center), tmpQ, ONE);
            mesh.setMatrixAt(i, tmpM);
        });
        mesh.instanceMatrix.needsUpdate = true;
    });
    return <instancedMesh ref={ref} args={[geometry, material, spec.count]} raycast={() => null} />;
}

const v = (a: Vec3) => new Vector3(...a);

// World-space corners to frame a loop: every actor across its whole track,
// field loops and particle boxes.
export function loopCorners(loop: ProcessLoopSpec): Vector3[] {
    const min = new Vector3(Infinity, Infinity, Infinity);
    const max = new Vector3(-Infinity, -Infinity, -Infinity);
    const grow = (c: Vector3, half: Vector3) => {
        min.min(c.clone().sub(half));
        max.max(c.clone().add(half));
    };
    for (const a of loop.actors) {
        const { r, h } = partExtent(a);
        const local = new Box3(new Vector3(-r, -r, -h), new Vector3(r, r, h));
        const rot = new Matrix4().makeRotationFromEuler(new Euler(...(a.assembled?.rotation ?? [0, 0, 0])));
        const half = local.applyMatrix4(rot).getSize(new Vector3()).multiplyScalar(0.5);
        const base = v(a.assembled?.position ?? [0, 0, 0]);
        const keys = [{ position: [0, 0, 0] as Vec3 }, ...a.track.filter((k) => k.position)];
        for (const k of keys) grow(base.clone().add(v(k.position ?? [0, 0, 0])), half);
    }
    for (const f of loop.fields ?? []) {
        const along = AXIS[f.axis ?? "y"].clone().multiplyScalar(f.length * 0.4);
        const across = new Vector3(1, 1, 1).sub(AXIS[f.axis ?? "y"]).multiplyScalar(f.radius * 1.6);
        grow(v(f.center ?? [0, 0, 0]), along.add(across));
    }
    for (const p of loop.particles ?? []) grow(v(p.center ?? [0, 0, 0]), v(p.size).multiplyScalar(0.5));
    return boxCorners(min, max);
}
