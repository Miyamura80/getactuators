import { useEffect, useRef } from "react";
import { BrandMark } from "./BrandMark";
import { EXPLODED_H, EXPLODED_W, drawExplodedActuator } from "../lib/exploded-actuator";

export function Hero() {
    return (
        <header className="hero">
            <div className="hero-main">
                <BrandMark size={54} className="hero-mark" />
                <h1>
                    Independent analysis
                    <br />
                    of actuators
                </h1>
                <p className="hero-sub">
                    Compare actuators for robot builders. Quadrupeds, arms, and legged
                    robots, ranked on the specs that decide a build.
                </p>
            </div>
            <ExplodedCanvas />
        </header>
    );
}

// Animated exploded view. Paints a complete frame on mount, pauses off screen,
// and holds a single still frame under prefers-reduced-motion.
function ExplodedCanvas() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const cv = ref.current;
        const ctx = cv?.getContext("2d");
        if (!cv || !ctx) return;
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        let raf = 0;
        let visible = true;

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = cv.clientWidth || EXPLODED_W;
            const width = Math.round(w * dpr);
            const height = Math.round(w * (EXPLODED_H / EXPLODED_W) * dpr);
            // Observing CSS size must not repeatedly reset an unchanged canvas.
            if (cv.width !== width || cv.height !== height) {
                cv.width = width;
                cv.height = height;
            }
            ctx.setTransform(cv.width / EXPLODED_W, 0, 0, cv.height / EXPLODED_H, 0, 0);
        };
        const loop = (t: number) => {
            drawExplodedActuator(ctx, t, false);
            raf = requestAnimationFrame(loop);
        };
        const start = () => {
            cancelAnimationFrame(raf);
            if (motion.matches) drawExplodedActuator(ctx, 0, true);
            else if (visible) raf = requestAnimationFrame(loop);
        };
        const onResize = () => {
            resize();
            drawExplodedActuator(ctx, performance.now(), motion.matches);
        };

        onResize();
        start();
        motion.addEventListener("change", start);
        window.addEventListener("resize", onResize);
        const ro =
            typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onResize);
        ro?.observe(cv);
        const io =
            typeof IntersectionObserver === "undefined"
                ? null
                : new IntersectionObserver(([entry]) => {
                      visible = entry.isIntersecting;
                      if (visible) start();
                      else cancelAnimationFrame(raf);
                  });
        io?.observe(cv);
        // Labels use JetBrains Mono; repaint once the webfont is in.
        document.fonts?.ready.then(() => drawExplodedActuator(ctx, performance.now(), motion.matches));

        return () => {
            cancelAnimationFrame(raf);
            motion.removeEventListener("change", start);
            window.removeEventListener("resize", onResize);
            ro?.disconnect();
            io?.disconnect();
        };
    }, []);

    return (
        <div className="hero-art">
            <canvas
                ref={ref}
                width={EXPLODED_W}
                height={EXPLODED_H}
                role="img"
                aria-label="Exploded view of a rotary actuator: housing, stator, rotor, planetary gear stage and output flange along one axis"
            />
        </div>
    );
}
