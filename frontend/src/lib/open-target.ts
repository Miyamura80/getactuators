import { useEffect } from "react";

// The method and guide text below a tool is folded into <details>. When a
// link targets a heading inside one (a joint callout, "#knee"), open it so the
// reader lands on the text rather than a closed summary.
export function useOpenTargetSection(): void {
    useEffect(() => {
        const open = () => {
            const id = decodeURIComponent(window.location.hash.slice(1));
            const target = id ? document.getElementById(id) : null;
            const fold = target?.closest("details");
            if (fold && !fold.open) {
                fold.open = true;
                target?.scrollIntoView();
            }
        };
        open();
        window.addEventListener("hashchange", open);
        return () => window.removeEventListener("hashchange", open);
    }, []);
}
