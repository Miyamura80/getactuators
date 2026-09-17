interface Props {
    size?: number;
    className?: string;
}

// Compact actuator glyph for section and card heading tags: a simplified
// version of the brand mark that stays legible at ~14px. Outer housing, hub,
// keyed shaft, and four short cross ticks. Thin cyan strokes, no fill but the
// center shaft.
export function BrandGlyph({ size = 15, className }: Props) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            <circle cx="50" cy="50" r="46" fill="none" stroke="var(--cyan)" strokeWidth="6" />
            <circle cx="50" cy="50" r="24" fill="none" stroke="var(--cyan)" strokeWidth="6" />
            <line x1="50" y1="4" x2="50" y2="26" stroke="var(--cyan)" strokeWidth="6" />
            <line x1="50" y1="74" x2="50" y2="96" stroke="var(--cyan)" strokeWidth="6" />
            <line x1="4" y1="50" x2="26" y2="50" stroke="var(--cyan)" strokeWidth="6" />
            <line x1="74" y1="50" x2="96" y2="50" stroke="var(--cyan)" strokeWidth="6" />
            <rect x="42" y="42" width="16" height="16" fill="var(--cyan)" />
        </svg>
    );
}
