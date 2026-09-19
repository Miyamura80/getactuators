import type { Actuator } from "../types";
import { CATEGORY_MAP } from "../types";
import { colorForBrand } from "../lib/brands";

interface Props {
    actuator: Actuator;
    className?: string;
}

// Deterministic small hash so every actuator gets a stable, distinct render
// without shipping real product photography (which we don't have rights to).
function hash(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

// A stylised actuator seen end-on, drawn in the brand's thin-cyan-on-black
// line style. Detail counts (slots, bolts, gear teeth) vary per actuator so
// the gallery reads as a set of distinct parts rather than one repeated icon.
export function ActuatorThumb({ actuator, className }: Props) {
    // Prefer a real product photo when we have one; otherwise fall through to
    // the deterministic schematic below so every part still renders.
    if (actuator.image_url) {
        return (
            <img
                src={actuator.image_url}
                className={className}
                alt={`${actuator.name} product photo`}
                loading="lazy"
                decoding="async"
                style={{ objectFit: "contain", width: "100%", height: "100%" }}
            />
        );
    }

    const h = hash(actuator.id);
    const cat = CATEGORY_MAP[actuator.category];
    const hue = cat?.hue ?? 200;
    const accent = `hsl(${hue} 70% 68%)`;
    const brand = colorForBrand(actuator.brand);

    const cx = 100;
    const cy = 100;
    const bolts = 4 + (h % 3) * 2; // 4, 6 or 8
    const slots = 16 + (h % 6) * 2; // 16..26
    const geared =
        actuator.category === "harmonic_precision" ||
        actuator.category === "cycloidal_premium";
    const teeth = 40 + (h % 8) * 4;
    const hubR = 15 + (h % 5);

    const slotTicks = Array.from({ length: slots }, (_, i) => {
        const a = (i / slots) * Math.PI * 2;
        const c = Math.cos(a);
        const s = Math.sin(a);
        return (
            <line
                key={`s${i}`}
                x1={cx + 46 * c}
                y1={cy + 46 * s}
                x2={cx + 56 * c}
                y2={cy + 56 * s}
                stroke="var(--cyan)"
                strokeWidth="1.4"
                opacity="0.55"
            />
        );
    });

    const boltHoles = Array.from({ length: bolts }, (_, i) => {
        const a = (i / bolts) * Math.PI * 2 - Math.PI / 2;
        return (
            <circle
                key={`b${i}`}
                cx={cx + 74 * Math.cos(a)}
                cy={cy + 74 * Math.sin(a)}
                r="4"
                fill="var(--black)"
                stroke="var(--cyan)"
                strokeWidth="1.6"
            />
        );
    });

    const teethTicks = geared
        ? Array.from({ length: teeth }, (_, i) => {
              const a = (i / teeth) * Math.PI * 2;
              const c = Math.cos(a);
              const s = Math.sin(a);
              return (
                  <line
                      key={`t${i}`}
                      x1={cx + 30 * c}
                      y1={cy + 30 * s}
                      x2={cx + 34 * c}
                      y2={cy + 34 * s}
                      stroke={accent}
                      strokeWidth="1.2"
                      opacity="0.8"
                  />
              );
          })
        : null;

    return (
        <svg
            viewBox="0 0 200 200"
            className={className}
            role="img"
            aria-label={`${actuator.name} render`}
            preserveAspectRatio="xMidYMid meet"
        >
            <defs>
                <radialGradient id={`glow-${h}`} cx="50%" cy="42%" r="60%">
                    <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
                    <stop offset="70%" stopColor="var(--black)" stopOpacity="0" />
                </radialGradient>
            </defs>
            <rect x="0" y="0" width="200" height="200" fill={`url(#glow-${h})`} />

            {/* Housing shell */}
            <circle
                cx={cx}
                cy={cy}
                r="84"
                fill="none"
                stroke="var(--line-strong)"
                strokeWidth="1"
            />
            <circle cx={cx} cy={cy} r="80" fill="none" stroke="var(--cyan)" strokeWidth="2.4" />
            {boltHoles}

            {/* Stator ring + slots */}
            <circle cx={cx} cy={cy} r="58" fill="none" stroke="var(--cyan)" strokeWidth="1.4" />
            <circle cx={cx} cy={cy} r="44" fill="none" stroke="var(--cyan)" strokeWidth="1.4" />
            {slotTicks}

            {/* Gear / rotor ring */}
            <circle cx={cx} cy={cy} r="34" fill="none" stroke={accent} strokeWidth="1.6" />
            {teethTicks}

            {/* Hub + keyed output shaft */}
            <circle
                cx={cx}
                cy={cy}
                r={hubR}
                fill="var(--panel-2)"
                stroke="var(--cyan)"
                strokeWidth="2.2"
            />
            <circle cx={cx} cy={cy} r="4.5" fill={brand} />
            <rect
                x={cx - 5}
                y={cy - 5}
                width="10"
                height="10"
                fill="none"
                stroke={brand}
                strokeWidth="1.6"
            />
        </svg>
    );
}
