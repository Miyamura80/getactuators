import { formatSourced } from "@/supply-chain/format";
import { CONFIDENCE_LABEL, type SourceId, type Sourced } from "@/supply-chain/sourced";
import { getSource } from "@/supply-chain/sources";
import { mdText } from "../md";

// Markdown footnotes for supply-chain twins: the same numbering the React
// page uses (first cited, first numbered) and a closing "Sources" section.
//
//   const fn = footnotes();
//   `${fn.value(company.revenue)} revenue`   -> "$224.4M[^1] revenue"
//   fn.section()                              -> "## Sources\n\n[^1]: ..."

export interface Footnotes {
    // "[^1][^2]" for these source ids, numbering new ones.
    ref(ids: readonly SourceId[]): string;
    // A formatted Sourced number with its footnote refs.
    value(s: Sourced<number>): string;
    // The "## Sources" section, or "" when nothing was cited.
    section(): string;
}

export function footnotes(): Footnotes {
    const order: SourceId[] = [];
    const number = (id: SourceId) => {
        let n = order.indexOf(id);
        if (n < 0) n = order.push(id) - 1;
        return n + 1;
    };
    const ref = (ids: readonly SourceId[]) =>
        ids.map((id) => `[^${number(id)}]`).join("");
    return {
        ref,
        value: (s) => {
            const text = `${s.confidence === "estimated" ? "~" : ""}${formatSourced(s)}`;
            const meta =
                s.confidence === "reported"
                    ? ""
                    : ` (${CONFIDENCE_LABEL[s.confidence].toLowerCase()}, ${s.asOf})`;
            return `${text}${ref(s.sources)}${meta}`;
        },
        section: () => {
            if (order.length === 0) return "";
            const lines = order.map((id, i) => {
                const s = getSource(id);
                if (!s) return `[^${i + 1}]: ${id}`;
                const pay = s.paywalled ? " Paywalled." : "";
                return `[^${i + 1}]: ${mdText(s.publisher)}, "${mdText(s.title)}". ${s.url} (accessed ${s.accessed}).${pay}`;
            });
            return `## Sources\n\n${lines.join("\n")}`;
        },
    };
}
