import { useEffect, useRef } from "react";
import { getSource } from "../../../../src/supply-chain/sources";
import { footnoteAnchor, useFootnotes } from "./footnotes";

const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");
const isFootnoteHash = (hash: string) => hash.startsWith("#sc-source-");

// Every source cited above it, numbered in first-cited order, collapsed by
// default. Footnote links open it before the browser scrolls to the entry.
// Render it last inside the <FootnotesProvider>.
export function SourcesSection() {
    const { order } = useFootnotes();
    const ref = useRef<HTMLDetailsElement>(null);
    useEffect(() => {
        const open = () => { if (ref.current) ref.current.open = true; };
        const onClick = (event: MouseEvent) => {
            const link = (event.target as Element | null)?.closest?.("a[href^='#']");
            if (link && isFootnoteHash(link.getAttribute("href") ?? "")) open();
        };
        const onHash = () => {
            if (!isFootnoteHash(window.location.hash)) return;
            open();
            document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
        };
        onHash();
        // Capture phase: the details must be open before the default jump.
        document.addEventListener("click", onClick, true);
        window.addEventListener("hashchange", onHash);
        return () => {
            document.removeEventListener("click", onClick, true);
            window.removeEventListener("hashchange", onHash);
        };
    }, []);
    if (order.length === 0) return null;
    return <details className="sc-sources" ref={ref}>
        <summary>Sources <span>({order.length})</span></summary>
        <ol>
            {order.map((id, i) => {
                const s = getSource(id);
                return <li key={id} id={footnoteAnchor(i + 1)}>
                    <span className="sc-sources-n">{i + 1}</span>
                    {s ? <span>
                        <span className="sc-sources-pub">{s.publisher}</span>
                        <a href={s.url} rel="noopener">{s.title}</a>
                        <span className="sc-sources-meta">{hostOf(s.url)} · {s.kind} · accessed {s.accessed}{s.paywalled ? " · paywalled" : ""}</span>
                    </span> : <span>{id}</span>}
                </li>;
            })}
        </ol>
    </details>;
}
