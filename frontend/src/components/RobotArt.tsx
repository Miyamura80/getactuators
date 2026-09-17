export type RobotKind = "humanoid" | "quadruped" | "robot_arm";

// Studio-render robot illustrations used as category thumbnails. Real product
// photography can't be pulled into this build, so these are hand-shaded SVG
// renders: metallic gradients, rim light and a floor shadow to read as a
// premium 3/4 product shot rather than flat line art. One render per card, so
// gradient ids are namespaced by kind to stay unique on the page.
export function RobotArt({ kind, hue }: { kind: RobotKind; hue: number }) {
    return (
        <svg
            viewBox="0 0 400 300"
            className="cat-art"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
        >
            <defs>
                <radialGradient id={`bg-${kind}`} cx="50%" cy="34%" r="80%">
                    <stop offset="0%" stopColor={`hsl(${hue} 42% 22%)`} />
                    <stop offset="52%" stopColor={`hsl(${hue} 38% 11%)`} />
                    <stop offset="100%" stopColor="#050607" />
                </radialGradient>
                <linearGradient id={`metal-${kind}`} x1="0" y1="0" x2="0.85" y2="1">
                    <stop offset="0%" stopColor="#fbfdff" />
                    <stop offset="26%" stopColor="#dfe7ee" />
                    <stop offset="60%" stopColor="#9aa6b1" />
                    <stop offset="100%" stopColor="#3c454e" />
                </linearGradient>
                <linearGradient id={`metal2-${kind}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#eef3f8" />
                    <stop offset="50%" stopColor="#b7c1cb" />
                    <stop offset="100%" stopColor="#5b6570" />
                </linearGradient>
                <linearGradient id={`dark-${kind}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#39424b" />
                    <stop offset="100%" stopColor="#0d1216" />
                </linearGradient>
                <radialGradient id={`joint-${kind}`} cx="38%" cy="32%" r="75%">
                    <stop offset="0%" stopColor="#c9d3dc" />
                    <stop offset="55%" stopColor="#6c7883" />
                    <stop offset="100%" stopColor="#161c22" />
                </radialGradient>
                <radialGradient id={`glow-${kind}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
                </radialGradient>
                <filter id={`soft-${kind}`} x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="6" />
                </filter>
            </defs>

            <rect width="400" height="300" fill={`url(#bg-${kind})`} />
            {/* soft key light bloom, upper left */}
            <ellipse cx="130" cy="70" rx="150" ry="110" fill="#ffffff" opacity="0.05" />

            {kind === "humanoid" && <Humanoid k={kind} />}
            {kind === "quadruped" && <Quadruped k={kind} />}
            {kind === "robot_arm" && <RobotArm k={kind} />}
        </svg>
    );
}

// Shared little helpers keep each robot readable.
const RIM = "var(--cyan)";

function Humanoid({ k }: { k: RobotKind }) {
    const M = `url(#metal-${k})`;
    const M2 = `url(#metal2-${k})`;
    const D = `url(#dark-${k})`;
    const J = `url(#joint-${k})`;
    // Nudge the figure down so the head lands inside the visible band when the
    // wide, short card slices the top and bottom off the square viewBox.
    return (
        <g transform="translate(0 44)">
            <ellipse cx="205" cy="286" rx="92" ry="14" fill="#000" opacity="0.55" filter={`url(#soft-${k})`} />
            {/* legs */}
            <g stroke="#0b0f13" strokeWidth="1">
                <rect x="176" y="196" width="22" height="60" rx="11" fill={M} />
                <rect x="212" y="196" width="22" height="60" rx="11" fill={M2} />
                <circle cx="187" cy="196" r="13" fill={J} />
                <circle cx="223" cy="196" r="13" fill={J} />
                <rect x="175" y="150" width="26" height="52" rx="13" fill={M} />
                <rect x="210" y="150" width="26" height="52" rx="13" fill={M2} />
                {/* feet */}
                <path d="M172 256 h30 l6 10 h-42 z" fill={D} />
                <path d="M208 256 h30 l6 10 h-42 z" fill={D} />
            </g>
            {/* pelvis */}
            <rect x="172" y="138" width="68" height="26" rx="12" fill={D} />
            {/* torso */}
            <path
                d="M168 80 q37 -14 74 0 l6 44 q-43 16 -86 0 z"
                fill={M}
                stroke="#0b0f13"
                strokeWidth="1"
            />
            {/* chest seam + accent */}
            <path d="M205 70 v54" stroke="#7c8894" strokeWidth="1.4" />
            <rect x="192" y="92" width="26" height="7" rx="3.5" fill={RIM} opacity="0.85" />
            {/* rim light on torso right edge */}
            <path d="M240 84 l6 40" stroke={RIM} strokeWidth="2.4" opacity="0.5" fill="none" />
            {/* shoulders */}
            <circle cx="166" cy="86" r="16" fill={J} />
            <circle cx="244" cy="86" r="16" fill={J} />
            {/* arms */}
            <g stroke="#0b0f13" strokeWidth="1">
                <rect x="150" y="92" width="18" height="46" rx="9" fill={M2} />
                <rect x="242" y="92" width="18" height="46" rx="9" fill={M} />
                <circle cx="159" cy="140" r="10" fill={J} />
                <circle cx="251" cy="140" r="10" fill={J} />
                <rect x="151" y="146" width="16" height="40" rx="8" fill={M2} />
                <rect x="243" y="146" width="16" height="40" rx="8" fill={M} />
                <circle cx="159" cy="190" r="8" fill={D} />
                <circle cx="251" cy="190" r="8" fill={D} />
            </g>
            {/* neck */}
            <rect x="197" y="60" width="16" height="16" rx="5" fill={D} />
            {/* head */}
            <rect x="182" y="26" width="46" height="42" rx="17" fill={M} stroke="#0b0f13" strokeWidth="1" />
            <rect x="188" y="34" width="34" height="20" rx="10" fill="#0a0e12" />
            <rect x="193" y="41" width="24" height="5" rx="2.5" fill={RIM} />
            <ellipse cx="205" cy="30" rx="16" ry="4" fill="#ffffff" opacity="0.5" />
        </g>
    );
}

function Quadruped({ k }: { k: RobotKind }) {
    const M = `url(#metal-${k})`;
    const M2 = `url(#metal2-${k})`;
    const D = `url(#dark-${k})`;
    const J = `url(#joint-${k})`;
    // A leg drawn as thigh + shin + foot, hip at (hx,hy).
    const leg = (hx: number, hy: number, dir: number, metal: string, key: string) => (
        <g key={key} stroke="#0b0f13" strokeWidth="1">
            <rect x={hx - 8} y={hy} width="16" height="40" rx="8" fill={metal} transform={`rotate(${dir * 8} ${hx} ${hy})`} />
            <circle cx={hx + dir * 5} cy={hy + 40} r="9" fill={J} />
            <rect x={hx + dir * 5 - 6} y={hy + 40} width="12" height="42" rx="6" fill={D} transform={`rotate(${-dir * 12} ${hx + dir * 5} ${hy + 40})`} />
            <circle cx={hx + dir * 5 - dir * 9} cy={hy + 80} r="4.5" fill={RIM} opacity="0.8" />
        </g>
    );
    return (
        <g>
            <ellipse cx="205" cy="284" rx="120" ry="13" fill="#000" opacity="0.55" filter={`url(#soft-${k})`} />
            {/* far legs (darker, behind) */}
            {leg(150, 150, -1, M2, "bl-far")}
            {leg(268, 150, 1, M2, "br-far")}
            {/* body */}
            <rect x="120" y="112" width="176" height="52" rx="24" fill={M} stroke="#0b0f13" strokeWidth="1" />
            {/* panel seams + accent strip */}
            <path d="M150 118 v40 M200 116 v46 M250 118 v40" stroke="#7c8894" strokeWidth="1.2" />
            <rect x="150" y="126" width="120" height="6" rx="3" fill={RIM} opacity="0.65" />
            <path d="M126 120 q80 -16 160 2" stroke="#ffffff" strokeWidth="2" opacity="0.4" fill="none" />
            {/* near legs */}
            {leg(168, 156, -1, M, "bl")}
            {leg(286, 156, 1, M, "br")}
            {/* neck + head, front-right */}
            <rect x="286" y="120" width="34" height="16" rx="8" fill={D} transform="rotate(-20 286 128)" />
            <rect x="300" y="96" width="40" height="30" rx="10" fill={M2} stroke="#0b0f13" strokeWidth="1" />
            <rect x="332" y="102" width="10" height="18" rx="4" fill="#0a0e12" />
            <circle cx="337" cy="111" r="3.4" fill={RIM} />
            {/* lidar dome on the back */}
            <ellipse cx="150" cy="110" rx="15" ry="9" fill={J} />
            <circle cx="150" cy="106" r="4" fill={RIM} />
            <ellipse cx="205" cy="112" rx="20" ry="4" fill="#ffffff" opacity="0.45" />
        </g>
    );
}

function RobotArm({ k }: { k: RobotKind }) {
    const M = `url(#metal-${k})`;
    const M2 = `url(#metal2-${k})`;
    const D = `url(#dark-${k})`;
    const J = `url(#joint-${k})`;
    return (
        <g>
            <ellipse cx="180" cy="282" rx="96" ry="14" fill="#000" opacity="0.55" filter={`url(#soft-${k})`} />
            {/* base */}
            <path d="M120 282 h120 l-14 -26 h-92 z" fill={D} />
            <rect x="150" y="228" width="60" height="34" rx="10" fill={M} stroke="#0b0f13" strokeWidth="1" />
            <ellipse cx="180" cy="228" rx="30" ry="9" fill={M2} />
            {/* shoulder joint */}
            <circle cx="180" cy="222" r="17" fill={J} />
            {/* link 1 (up) */}
            <rect x="169" y="150" width="24" height="76" rx="11" fill={M} stroke="#0b0f13" strokeWidth="1" transform="rotate(12 181 190)" />
            <rect x="176" y="156" width="4" height="64" rx="2" fill="#ffffff" opacity="0.4" transform="rotate(12 181 190)" />
            {/* elbow joint */}
            <circle cx="196" cy="150" r="15" fill={J} />
            {/* link 2 (diagonal to upper right) */}
            <rect x="196" y="86" width="22" height="72" rx="10" fill={M2} stroke="#0b0f13" strokeWidth="1" transform="rotate(52 207 122)" />
            <path d="M232 128 l40 -26" stroke={RIM} strokeWidth="2.2" opacity="0.5" />
            {/* wrist joint */}
            <circle cx="256" cy="98" r="12" fill={J} />
            {/* tool flange + gripper */}
            <rect x="262" y="80" width="26" height="18" rx="5" fill={D} transform="rotate(30 275 89)" />
            <path d="M286 74 l14 -8 M286 92 l14 8" stroke={M} strokeWidth="7" strokeLinecap="round" />
            <circle cx="256" cy="98" r="4" fill={RIM} />
            {/* accent ring on base */}
            <rect x="156" y="238" width="48" height="6" rx="3" fill={RIM} opacity="0.7" />
        </g>
    );
}
