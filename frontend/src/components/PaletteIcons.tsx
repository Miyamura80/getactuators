interface IconProps {
    size?: number;
    className?: string;
}

// Robot icon from eito.me/icons (Eito Miyamura's icon library, `robot`, mono).
// Uses currentColor so the palette row's kind color drives it.
export function RobotIcon({ size = 20, className }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            width={size}
            height={size}
            fill="currentColor"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            <circle cx="128" cy="24" r="10" fill="none" stroke="currentColor" strokeWidth="6" />
            <rect x="125" y="34" width="6" height="20" />
            <path
                fillRule="evenodd"
                d="M40,144a88,88,0,0,1,176,0v44a44,44,0,0,1-44,44H84a44,44,0,0,1-44-44Z M92,116 h72 a28,28 0 0 1 28,28 v24 a28,28 0 0 1 -28,28 h-72 a28,28 0 0 1 -28,-28 v-24 a28,28 0 0 1 28,-28 z"
            />
            <rect x="88" y="138" width="24" height="36" rx="12" />
            <rect x="144" y="138" width="24" height="36" rx="12" />
        </svg>
    );
}

// Actuator icon: the house actuator glyph (outer housing, hub, keyed shaft, four
// cross ticks), drawn in currentColor. eito.me/icons has no actuator icon, so
// this reuses the site's own actuator mark to keep the palette on-brand.
export function ActuatorIcon({ size = 18, className }: IconProps) {
    return (
        <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="7" />
            <circle cx="50" cy="50" r="23" fill="none" stroke="currentColor" strokeWidth="7" />
            <line x1="50" y1="4" x2="50" y2="27" stroke="currentColor" strokeWidth="7" />
            <line x1="50" y1="73" x2="50" y2="96" stroke="currentColor" strokeWidth="7" />
            <line x1="4" y1="50" x2="27" y2="50" stroke="currentColor" strokeWidth="7" />
            <line x1="73" y1="50" x2="96" y2="50" stroke="currentColor" strokeWidth="7" />
            <rect x="42" y="42" width="16" height="16" fill="currentColor" />
        </svg>
    );
}
