import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";

// Engineering-tool events for /measurement.js, which checks consent, the
// route and the catalog IDs. No typed input value leaves the page.

export type ToolQuantity = "torque" | "power" | "speed" | "holding";

function dispatch(detail: object) {
    window.dispatchEvent(new CustomEvent("actuatorlist:tool", { detail }));
}

// Once per page view: the first valid result after the visitor changes an
// input. A result already on screen at load (defaults or a shared link) is
// not a use of the tool.
export function useToolResultEvent(inputs: string, quantity: ToolQuantity | null) {
    const initial = useRef(inputs);
    const sent = useRef(false);
    useEffect(() => {
        if (sent.current || quantity == null || inputs === initial.current) return;
        sent.current = true;
        dispatch({ action: "result", quantity });
    }, [inputs, quantity]);
}

// Left and middle clicks on a shortlist link; navigation is never delayed.
export function shortlistClick(target: "product" | "compare", productIds: string[]) {
    const send = () => dispatch({ action: "shortlist", target, productIds });
    return {
        onClick: send,
        onAuxClick: (e: MouseEvent) => {
            if (e.button === 1) send();
        },
    };
}
