import { type ReactNode, useEffect, useRef } from "react";

// The panel a map selection opens: beside the map on wide screens, a bottom
// sheet on phones. Escape or the close button clears the selection. Pages put
// their own content in it (CompanyDrawer, SiteDetail).
export function MapDrawer({ open, title, kicker, onClose, children }: {
    open: boolean;
    title: string;
    kicker?: ReactNode;
    onClose: () => void;
    children?: ReactNode;
}) {
    const ref = useRef<HTMLElement>(null);
    useEffect(() => {
        if (!open) return;
        ref.current?.focus({ preventScroll: true });
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, title, onClose]);
    if (!open) return null;
    return <aside ref={ref} className="mk-drawer" aria-label={title} tabIndex={-1}>
        <header>
            {kicker ? <span className="mk-drawer-kicker">{kicker}</span> : null}
            <h3>{title}</h3>
            <button type="button" className="mk-drawer-close" aria-label="Close" title="Close" onClick={onClose}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
        </header>
        <div className="mk-drawer-body">{children}</div>
    </aside>;
}
