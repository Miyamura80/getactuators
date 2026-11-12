import { useEffect, useRef } from "react";
import type { HeaderMenu as Menu } from "../../../../src/public-navigation";

// One dropdown in the public header ("Market intel", "Supply chain"). Links
// that are not live yet (supply-chain preview only) render inert.
export function HeaderMenu({ menu, path, onNavigate }: {
    menu: Menu;
    path: string;
    onNavigate?: () => void;
}) {
    const ref = useRef<HTMLDetailsElement>(null);
    useEffect(() => {
        const close = (event: MouseEvent) => {
            const el = ref.current;
            if (el?.open && !el.contains(event.target as Node)) el.open = false;
        };
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, []);
    const current = menu.groups.some((g) => g.links.some((l) => l.href === path));
    return <details className="site-sub" data-menu={menu.id} ref={ref} onToggle={(event) => {
        // One dropdown open at a time.
        if (!event.currentTarget.open) return;
        for (const other of document.querySelectorAll<HTMLDetailsElement>(".site-sub[open]")) {
            if (other !== event.currentTarget) other.open = false;
        }
    }} onKeyDown={(event) => {
        if (event.key === "Escape" && event.currentTarget.open) {
            event.stopPropagation();
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
        }
    }}>
        <summary className={current ? "is-current" : undefined}>{menu.label}</summary>
        <div className="site-sub-panel">
            {menu.groups.map((g) => <section key={g.label}>
                <h3>{g.label}</h3>
                {g.links.map((l) => l.live
                    ? <a key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}
                        onClick={() => { if (ref.current) ref.current.open = false; onNavigate?.(); }}>{l.label}</a>
                    : <span key={l.href} className="site-sub-soon" aria-disabled="true">{l.label}<small>soon</small></span>)}
            </section>)}
        </div>
    </details>;
}
