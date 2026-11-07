import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { type Box, type CamSpec, camera, fit } from "../lib/robot-art/core";
import { drawDrafting } from "../lib/robot-art/drafting";
import type { Vec3 } from "../lib/robot-art/math";
import type { Scene } from "../lib/robot-art/scene";

export type Project = (p: Vec3) => [number, number];

// The /robots X-ray engineering drawing, with an SVG layer on top in the same
// W x H units: the canvas paints the robot, `overlay` adds links, callouts
// and dimensions at projected 3D points. Repaints only when the box resizes.
export function DraftingFigure({
    scene,
    cam,
    box,
    W,
    H,
    label,
    overlay,
}: {
    scene: Scene;
    cam: CamSpec;
    box: Box;
    W: number;
    H: number;
    label: string;
    overlay: (project: Project) => ReactNode;
}) {
    const ref = useRef<HTMLCanvasElement>(null);
    const view = useMemo(() => {
        const c = camera(cam);
        const fr = fit([scene], c, box);
        const project: Project = (p) => fr.P(c.to(p));
        return { c, fr, project };
    }, [scene, cam, box]);

    useEffect(() => {
        const cv = ref.current;
        const ctx = cv?.getContext("2d");
        if (!cv || !ctx) return;
        let raf = 0;
        let size = "";
        const paint = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = Math.round(cv.clientWidth * dpr);
            const h = Math.round(cv.clientHeight * dpr);
            if (!w || !h || `${w}x${h}` === size) return;
            size = `${w}x${h}`;
            cv.width = w;
            cv.height = h;
            // Draw in figure units so the overlay's projection lines up.
            ctx.setTransform(w / W, 0, 0, h / H, 0, 0);
            drawDrafting({ ctx, W, H, u: Math.min(W / 400, H / 300) }, scene, view.c, view.fr);
        };
        const schedule = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(paint);
        };
        schedule();
        const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
        ro?.observe(cv);
        return () => {
            cancelAnimationFrame(raf);
            ro?.disconnect();
        };
    }, [scene, view, W, H]);

    return (
        <figure className="draft-fig" style={{ aspectRatio: `${W} / ${H}` }}>
            <canvas ref={ref} aria-hidden="true" />
            <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={label}>
                {overlay(view.project)}
            </svg>
        </figure>
    );
}
