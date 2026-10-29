import { useState } from "react";

// Shared chrome for the kit wrappers: poster, icons. No three.js here.

export const posterUrl = (id: string) => `/posters/${id}.png`;

export function Poster({ src, alt }: { src: string; alt: string }) {
    const [missing, setMissing] = useState(false);
    if (missing) {
        return (
            <svg className="x3-poster x3-poster-missing" viewBox="0 0 240 150" role="img" aria-label={alt}>
                <title>{alt}</title>
                {[0, 1, 2, 3].map((i) => (
                    <ellipse key={i} cx={60 + i * 40} cy="75" rx="16" ry="44" fill="none" stroke="currentColor" />
                ))}
                <line x1="30" y1="75" x2="210" y2="75" stroke="currentColor" strokeDasharray="6 3 1 3" />
            </svg>
        );
    }
    return <img className="x3-poster" src={src} alt={alt} decoding="async" loading="lazy" onError={() => setMissing(true)} />;
}

const svg = {
    viewBox: "0 0 24 24",
    width: 18,
    height: 18,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    "aria-hidden": true,
} as const;

// Three discs touching: the assembled end of the explode slider.
export function AssembledIcon() {
    return (
        <svg {...svg}>
            <rect x="7" y="5" width="3" height="14" />
            <rect x="10" y="4" width="3" height="16" />
            <rect x="13" y="6" width="3" height="12" />
        </svg>
    );
}

// The same discs pulled apart along the axis.
export function ExplodedIcon() {
    return (
        <svg {...svg}>
            <rect x="2" y="5" width="3" height="14" />
            <rect x="10.5" y="4" width="3" height="16" />
            <rect x="19" y="6" width="3" height="12" />
            <path d="M6.5 12h2.5M15 12h2.5" strokeDasharray="1 1.5" />
        </svg>
    );
}

export function PlayIcon() {
    return (
        <svg {...svg}>
            <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none" />
        </svg>
    );
}

export function PauseIcon() {
    return (
        <svg {...svg}>
            <path d="M8 5.5v13M16 5.5v13" strokeWidth="2.6" />
        </svg>
    );
}

// Wireframe cube: wake this scene in 3D.
export function CubeIcon() {
    return (
        <svg {...svg}>
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
            <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
        </svg>
    );
}
