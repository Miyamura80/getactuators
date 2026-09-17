interface Props {
    size?: number;
    className?: string;
}

// The getactuators mark: a rotary actuator seen end-on. Circular housing with
// four mounting bolt holes, a ring of stator slots, a hub, and a keyed output
// shaft with a rotation arc. Thin cyan strokes on black, no fill, no gradients.
export function BrandMark({ size = 40, className }: Props) {
    const cx = 50;
    const cy = 50;
    // Stator slots: short radial ticks around the ring.
    const slots = Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const c = Math.cos(a);
        const s = Math.sin(a);
        return (
            <line
                key={i}
                x1={cx + 30 * c}
                y1={cy + 30 * s}
                x2={cx + 40 * c}
                y2={cy + 40 * s}
                stroke="var(--cyan)"
                strokeWidth="2"
            />
        );
    });
    // Mounting bolt holes on the diagonals.
    const bolts = [45, 135, 225, 315].map((deg) => {
        const a = (deg / 180) * Math.PI;
        return (
            <circle
                key={deg}
                cx={cx + 39 * Math.cos(a)}
                cy={cy + 39 * Math.sin(a)}
                r="3"
                fill="none"
                stroke="var(--cyan)"
                strokeWidth="2"
            />
        );
    });
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            {/* Housing */}
            <circle cx={cx} cy={cy} r="47" fill="none" stroke="var(--cyan)" strokeWidth="2.5" />
            {/* Stator ring */}
            <circle cx={cx} cy={cy} r="41" fill="none" stroke="var(--cyan)" strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r="29" fill="none" stroke="var(--cyan)" strokeWidth="1.5" />
            {slots}
            {bolts}
            {/* Hub + keyed output shaft */}
            <circle cx={cx} cy={cy} r="13" fill="none" stroke="var(--cyan)" strokeWidth="2.5" />
            <rect x="45" y="45" width="10" height="10" fill="var(--cyan)" />
            {/* Rotation arc + arrowhead */}
            <path
                d="M 74 34 A 30 30 0 0 1 78 55"
                fill="none"
                stroke="var(--cyan)"
                strokeWidth="2"
            />
            <path d="M 78 55 L 74 49 L 82 49 Z" fill="var(--cyan)" />
        </svg>
    );
}
