import type { KeyboardEvent } from "react";

// Click and keyboard props for an SVG group that acts as a link, so chart
// marks are focusable and open on Enter or Space as well as a click.
export function activation(label: string, go: () => void) {
    return {
        role: "link",
        tabIndex: 0,
        "aria-label": label,
        style: { cursor: "pointer" },
        onClick: go,
        onKeyDown: (e: KeyboardEvent<SVGGElement>) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                go();
            }
        },
    };
}
