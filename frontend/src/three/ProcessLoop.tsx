import { Suspense, lazy, useId, useRef, useState } from "react";
import type { ProcessLoopSpec } from "../../../src/supply-chain/scenes/spec";
import { CubeIcon, PauseIcon, PlayIcon, Poster, posterUrl } from "./kit-ui";
import { claimLive, hasWebGL, useInView, useLiveSlot, useReducedMotion } from "./support";
import "./three.css";

const ProcessLoopCanvas = lazy(() => import("./scene/ProcessLoopCanvas"));

export interface ProcessLoopProps {
    loop: ProcessLoopSpec;
    poster?: string;
    className?: string;
}

// A looping manufacturing vignette (a press closing in a field, a mill
// spinning). Plays while on screen with a pause control; under reduced
// motion it holds the poster frame until the viewer presses play.
export function ProcessLoop({ loop, poster: posterSrc, className }: ProcessLoopProps) {
    const root = useRef<HTMLElement>(null);
    const key = `${loop.id}:${useId()}`;
    const reduced = useReducedMotion();
    const gl = hasWebGL();
    const { visible, seen } = useInView(root);
    const live = useLiveSlot(key, gl && seen);
    const [playing, setPlaying] = useState<boolean | null>(null);
    const isPlaying = playing ?? !reduced;
    const [step, setStep] = useState(-1);
    const [ready, setReady] = useState(false);
    const poster = <Poster src={posterSrc ?? posterUrl(loop.id)} alt={loop.title} />;
    const steps = loop.steps ?? [];

    return (
        <figure
            ref={root}
            className={`x3 x3-loop${className ? ` ${className}` : ""}`}
            data-mode={live ? "live" : "poster"}
            data-motion={reduced ? "reduced" : "full"}
            data-ready={live && ready ? "true" : "false"}
            aria-label={loop.title}
        >
            <div className="x3-stage">
                {live ? (
                    <Suspense fallback={poster}>
                        <ProcessLoopCanvas
                            loop={loop}
                            playing={isPlaying}
                            still={reduced && !playing}
                            visible={visible}
                            onStep={setStep}
                            onReady={() => setReady(true)}
                        />
                    </Suspense>
                ) : (
                    poster
                )}
                {!live && gl && (
                    <button type="button" className="x3-wake" aria-label={`Show ${loop.title} in 3D`} onClick={() => claimLive(key)}>
                        <CubeIcon />
                    </button>
                )}
            </div>
            <div className="x3-bar">
                {live && (
                    <button
                        type="button"
                        className="x3-play"
                        aria-label={isPlaying ? "Pause" : "Play"}
                        aria-pressed={isPlaying}
                        onClick={() => setPlaying(!isPlaying)}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                )}
                {steps.length > 0 && (
                    <ol className="x3-steps">
                        {steps.map((s, i) => (
                            <li key={s.label} aria-current={live && i === step ? "step" : undefined}>
                                {s.label}
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </figure>
    );
}
