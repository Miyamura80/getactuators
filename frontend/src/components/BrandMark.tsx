interface Props {
    size?: number;
    className?: string;
}

// The getactuators mark: a wireframe square with a solid accent tag anchored to
// the top-left corner (40% wide x 10% tall), on black. Square corners, no fill.
export function BrandMark({ size = 40, className }: Props) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            <rect
                x="2"
                y="2"
                width="96"
                height="96"
                fill="none"
                stroke="var(--cyan)"
                strokeWidth="2"
            />
            {/* Tag: 40% x 10%, flush inside the top-left corner */}
            <rect x="3" y="3" width="40" height="10" fill="var(--cyan)" />
            <rect x="50" y="49" width="1.5" height="1.5" fill="var(--cyan)" />
        </svg>
    );
}
