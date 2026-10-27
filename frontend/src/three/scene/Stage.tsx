// three.js objects and frame refs are mutated every frame by design (R3F).
/* eslint-disable react-hooks/immutability */
import {
    type ReconcilerRoot,
    createRoot,
    events,
    extend,
    useFrame,
    useThree,
} from "@react-three/fiber";
import {
    type ReactNode,
    useEffect,
    useInsertionEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Color,
    DirectionalLight,
    Group,
    HemisphereLight,
    InstancedMesh,
    LineSegments,
    Mesh,
    type PerspectiveCamera,
    TOUCH,
    Vector3,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { INK } from "./look";

// R3F's <Canvas> registers the whole THREE namespace, which defeats tree
// shaking. The kit registers only the classes it renders, which keeps the
// lazy 3D chunk inside its size budget.
extend({ Color, DirectionalLight, Group, HemisphereLight, InstancedMesh, LineSegments, Mesh });

export interface StageProps {
    // Animate every frame; otherwise render on demand (reduced motion, idle).
    animate: boolean;
    // False while the scene is scrolled out of view: stop rendering.
    visible: boolean;
    onReady?: () => void;
    onPointerMissed?: () => void;
    children: ReactNode;
}

// The one canvas setup every kit scene uses: black stage, soft key light so
// near-black faces still read as solids, orbit without zoom or pan so the
// page keeps its scroll.
interface Size {
    width: number;
    height: number;
    top: number;
    left: number;
}

export function Stage({ animate, visible, onReady, onPointerMissed, children }: StageProps) {
    const wrap = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const root = useRef<ReconcilerRoot<HTMLCanvasElement> | null>(null);
    const [size, setSize] = useState<Size | null>(null);

    useLayoutEffect(() => {
        const el = wrap.current;
        if (!el) return;
        const measure = () => {
            const r = el.getBoundingClientRect();
            setSize((s) =>
                s && s.width === r.width && s.height === r.height
                    ? s
                    : { width: r.width, height: r.height, top: r.top, left: r.left },
            );
        };
        measure();
        if (typeof ResizeObserver !== "function") return;
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Insertion cleanups survive StrictMode's effect replay, so the WebGL
    // context is created once and released only on real removal.
    useInsertionEffect(
        () => () => {
            root.current?.unmount();
            root.current = null;
        },
        [],
    );

    const frameloop = !visible ? "never" : animate ? "always" : "demand";
    useLayoutEffect(() => {
        const el = canvas.current;
        if (!el || !size || size.width === 0 || size.height === 0) return;
        if (!root.current) root.current = createRoot(el);
        const r = root.current;
        r.configure({
            gl: { antialias: true, alpha: false },
            events,
            frameloop,
            dpr: [1, 2],
            camera: { fov: 26, near: 1, far: 8000, position: [0, 0, 600] },
            size,
            onPointerMissed,
            onCreated: (state) => {
                if (wrap.current) state.events.connect?.(wrap.current);
                onReady?.();
            },
        }).then(() =>
            r.render(
                <>
                    <color attach="background" args={[INK.background]} />
                    <hemisphereLight args={["#d8fffd", "#000000", 2.2]} />
                    <directionalLight position={[2, 3, 4]} intensity={2.4} />
                    {children}
                    <Controls />
                </>,
            ),
        );
    });

    return (
        <div ref={wrap} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <canvas ref={canvas} style={{ display: "block", width: "100%", height: "100%" }} />
        </div>
    );
}

// Orbit without zoom or pan. One finger scrolls the page (touch-action
// pan-y); two fingers turn the model, so a phone user never gets stuck.
function Controls() {
    const camera = useThree((s) => s.camera);
    const gl = useThree((s) => s.gl);
    const set = useThree((s) => s.set);
    const invalidate = useThree((s) => s.invalidate);
    const controls = useMemo(() => new OrbitControls(camera, gl.domElement), [camera, gl]);
    useEffect(() => {
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.rotateSpeed = 0.55;
        controls.touches = { ONE: null, TWO: TOUCH.DOLLY_ROTATE };
        gl.domElement.style.touchAction = "pan-y";
        const onChange = () => invalidate();
        controls.addEventListener("change", onChange);
        set({ controls });
        return () => {
            controls.removeEventListener("change", onChange);
            controls.dispose();
            set({ controls: null });
        };
    }, [controls, gl, set, invalidate]);
    useFrame(() => controls.update(), -1);
    return null;
}

// Place the camera along `dir` so every corner fits the frame with a margin.
export function fitDistance(
    corners: Vector3[],
    center: Vector3,
    dir: Vector3,
    fovDeg: number,
    aspect: number,
    margin = 1.12,
): number {
    const back = dir.clone().normalize();
    const right = new Vector3(0, 1, 0).cross(back).normalize();
    const up = back.clone().cross(right).normalize();
    const tanV = Math.tan(((fovDeg / 2) * Math.PI) / 180);
    const tanH = tanV * aspect;
    let d = 0;
    for (const c of corners) {
        const v = c.clone().sub(center);
        const z = v.dot(back);
        d = Math.max(d, (Math.abs(v.dot(right)) * margin) / tanH + z, (Math.abs(v.dot(up)) * margin) / tanV + z);
    }
    return d;
}

export function boxCorners(min: Vector3, max: Vector3): Vector3[] {
    const out: Vector3[] = [];
    for (const x of [min.x, max.x])
        for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) out.push(new Vector3(x, y, z));
    return out;
}

// Frames `corners` (world space) from direction `dir`, refitting on resize.
export function Frame({ corners, dir, margin = 1.12 }: { corners: Vector3[]; dir: Vector3; margin?: number }) {
    const camera = useThree((s) => s.camera) as PerspectiveCamera;
    const size = useThree((s) => s.size);
    const controls = useThree((s) => s.controls) as unknown as { target: Vector3; update: () => void } | null;
    const invalidate = useThree((s) => s.invalidate);
    useLayoutEffect(() => {
        const center = corners
            .reduce((acc, c) => acc.add(c), new Vector3())
            .multiplyScalar(1 / Math.max(1, corners.length));
        const aspect = size.width / Math.max(1, size.height);
        const d = fitDistance(corners, center, dir, camera.fov, aspect, margin);
        camera.position.copy(center).add(dir.clone().normalize().multiplyScalar(d));
        camera.near = Math.max(0.5, d / 50);
        camera.far = d * 6;
        camera.lookAt(center);
        camera.updateProjectionMatrix();
        if (controls) {
            controls.target.copy(center);
            controls.update();
        }
        invalidate();
    }, [corners, dir, margin, camera, size.width, size.height, controls, invalidate]);
    return null;
}
