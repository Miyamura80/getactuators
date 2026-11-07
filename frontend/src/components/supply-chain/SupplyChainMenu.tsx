import { useEffect, useRef } from "react";
import { supplyChainMenu } from "../../../../src/public-navigation";

// "Supply chain" dropdown in the public header. Renders nothing until a
// supply-chain page is live; `preview` shows every planned page (not yet
// built ones inert) for /lab/supply-chain.
export function SupplyChainMenu({ path, preview = false, onNavigate }: {
    path: string;
    preview?: boolean;
    onNavigate?: () => void;
}) {
    const ref = useRef<HTMLDetailsElement>(null);
    const groups = supplyChainMenu(preview);
    useEffect(() => {
        const close = (event: MouseEvent) => {
            const menu = ref.current;
            if (menu?.open && !menu.contains(event.target as Node)) menu.open = false;
        };
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, []);
    if (groups.length === 0) return null;
    const current = groups.some((g) => g.links.some((l) => l.href === path));
    return <details className="site-sub" ref={ref} onKeyDown={(event) => {
        if (event.key === "Escape" && event.currentTarget.open) {
            event.stopPropagation();
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
        }
    }}>
        <summary className={current ? "is-current" : undefined}>Supply chain</summary>
        <div className="site-sub-panel">
            {groups.map((g) => <section key={g.label}>
                <h3>{g.label}</h3>
                {g.links.map((l) => l.live
                    ? <a key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}
                        onClick={() => { if (ref.current) ref.current.open = false; onNavigate?.(); }}>{l.label}</a>
                    : <span key={l.href} className="site-sub-soon" aria-disabled="true">{l.label}<small>soon</small></span>)}
            </section>)}
        </div>
    </details>;
}
