import { getSource } from "../../../../src/supply-chain/sources";
import { footnoteAnchor, useFootnotes } from "./footnotes";

const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

// Every source cited above it, numbered in first-cited order. Render it last
// inside the <FootnotesProvider>, after all the values that cite.
export function SourcesSection() {
    const { order } = useFootnotes();
    if (order.length === 0) return null;
    return <section className="sc-sources" aria-labelledby="sc-sources-h">
        <h2 id="sc-sources-h">Sources</h2>
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
    </section>;
}
