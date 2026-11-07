import { useCallback, useEffect, useState } from "react";

// tool_result for /measurement.js, which checks consent and the route and
// sends it at most once per page view. No typed input value leaves the page.

export const TOOL_QUANTITIES = ["torque", "power", "speed", "holding"] as const;
export type ToolQuantity = (typeof TOOL_QUANTITIES)[number];

// Returns the function the page's visitor-facing setters call. Changes made
// any other way (load from a shared link, an in-page agent tool) never mark
// an edit, so they never count as a use of the tool.
export function useToolResultEvent(quantity: ToolQuantity | null): () => void {
    const [edits, setEdits] = useState(0);
    useEffect(() => {
        if (edits === 0 || quantity == null) return;
        window.dispatchEvent(new CustomEvent("actuatorlist:tool-result", { detail: { quantity } }));
    }, [edits, quantity]);
    return useCallback(() => setEdits((n) => n + 1), []);
}
