import { createContext, useContext, useState, type ReactNode } from "react";
import type { SourceId } from "../../../../src/supply-chain/sourced";

// Collects the sources a page cites in render order, so every SourcedValue
// gets a stable footnote number and <SourcesSection> lists them at the end.
// The markdown twin numbers the same way (src/server/agent/supply-chain/footnotes.ts).

export class FootnoteRegistry {
    readonly order: SourceId[] = [];

    number(id: SourceId): number {
        let n = this.order.indexOf(id);
        if (n < 0) n = this.order.push(id) - 1;
        return n + 1;
    }
}

const FootnoteContext = createContext<FootnoteRegistry | null>(null);

export function FootnotesProvider({ children }: { children: ReactNode }) {
    const [registry] = useState(() => new FootnoteRegistry());
    return <FootnoteContext.Provider value={registry}>{children}</FootnoteContext.Provider>;
}

export function useFootnotes(): FootnoteRegistry {
    const registry = useContext(FootnoteContext);
    if (!registry) throw new Error("useFootnotes() needs a <FootnotesProvider> above it");
    return registry;
}

export const footnoteAnchor = (n: number) => `sc-source-${n}`;
