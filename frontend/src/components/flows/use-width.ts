import { useEffect, useRef, useState } from "react";

// The element's content width, tracked with a ResizeObserver; `fallback`
// until the first measurement (and in environments without one).
export function useWidth<T extends HTMLElement>(fallback: number) {
    const ref = useRef<T>(null);
    const [width, setWidth] = useState(fallback);
    useEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(([e]) => {
            if (e && e.contentRect.width > 0) setWidth(Math.round(e.contentRect.width));
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    return { ref, width };
}
