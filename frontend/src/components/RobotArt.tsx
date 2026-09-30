import { useEffect, useRef } from "react";
import { drawRobotArt, type RobotArtFraming, type RobotKind } from "../lib/robot-art";

export type { RobotKind };

// Category robot render: a real-scale 3D model (UR5e-class arm, G1-class
// humanoid, Go2-class quadruped) drawn as an X-ray engineering drawing that
// shows every actuator, on a canvas that fills its parent. It is a still
// image, so it only repaints when the box changes size.
export function RobotArt({ kind, framing = "tile" }: { kind: RobotKind; framing?: RobotArtFraming }) {
    const ref = useRef<HTMLCanvasElement>(null);

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
            drawRobotArt(ctx, w, h, kind, framing);
        };
        const schedule = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(paint);
        };
        schedule();
        const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
        ro?.observe(cv);
        // Callout labels use JetBrains Mono; repaint once the webfont is in.
        document.fonts?.ready.then(() => {
            size = "";
            schedule();
        });
        return () => {
            cancelAnimationFrame(raf);
            ro?.disconnect();
        };
    }, [kind, framing]);

    return <canvas ref={ref} className="cat-art" aria-hidden="true" />;
}
