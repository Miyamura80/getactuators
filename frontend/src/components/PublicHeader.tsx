import { useEffect, useRef } from "react";
import { PUBLIC_LINKS } from "../../../src/public-navigation";
import { BrandMark } from "./BrandMark";

export function PublicHeader({ path, initialOpen = false }: { path: string; initialOpen?: boolean }) {
    const ref = useRef<HTMLDetailsElement>(null);
    useEffect(() => {
        const menu = ref.current!;
        const summary = menu.querySelector("summary")!;
        const sync = () => summary.setAttribute("aria-expanded", String(menu.open));
        // Read native DOM state: a visitor may open the SSR menu before hydration.
        sync();
        menu.addEventListener("toggle", sync);
        const resize = () => { if (window.innerWidth > 860) menu.open = false; };
        window.addEventListener("resize", resize);
        return () => { menu.removeEventListener("toggle", sync); window.removeEventListener("resize", resize); };
    }, []);
    return <header className="site-header">
        <a href="/" className="site-brand" aria-label="actuatorlist home">
            <BrandMark size={24} />
            <span><b>actuator</b>list.com</span><span className="alpha-tag">alpha</span>
        </a>
        <details className="site-menu" open={initialOpen} ref={ref} onKeyDown={(event) => {
            if (event.key === "Escape" && event.currentTarget.open) {
                event.currentTarget.open = false;
                event.currentTarget.querySelector("summary")?.focus();
            }
        }}>
            <summary aria-label="Menu" aria-controls="public-navigation"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></summary>
            <nav id="public-navigation" aria-label="Site">
                {PUBLIC_LINKS.map(([href, label]) => <a key={href} href={href}
                    aria-current={path === href ? "page" : undefined}
                    onClick={() => { if (ref.current) ref.current.open = false; }}>
                    {label}
                </a>)}
            </nav>
        </details>
    </header>;
}
