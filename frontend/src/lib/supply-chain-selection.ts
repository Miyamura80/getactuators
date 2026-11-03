import { useCallback, useEffect, useState } from "react";

// One selection shared across a supply-chain page's views (map, 3D, graph),
// mirrored to the URL hash so it deep links: /manufacturing#step=jet-milling,
// /bom/optimus-linear#node=rotor-magnet. Footnote jumps (#sc-source-3) leave
// the selection alone in the page, but the footnote anchor replaces the hash,
// so the URL drops #step= until the next selection. Accepted: a reload after
// reading a footnote shows the map unselected.

export type SelectionKey = "step" | "node";

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function readSelection(hash: string, key: SelectionKey): string | null {
    const m = hash.replace(/^#/, "").match(new RegExp(`(?:^|&)${key}=([^&]*)`));
    if (!m?.[1]) return null;
    let id = m[1];
    try {
        id = decodeURIComponent(id);
    } catch {
        return null;
    }
    return ID.test(id) ? id : null;
}

export function selectionHash(key: SelectionKey, id: string | null): string {
    return id ? `#${key}=${encodeURIComponent(id)}` : "";
}

// [selected id, select]. Selecting replaces the hash without a history
// entry; back and forward still restore it through hashchange.
export function useSupplyChainSelection(
    key: SelectionKey,
    isKnown: (id: string) => boolean = () => true,
): [string | null, (id: string | null) => void] {
    const read = useCallback(() => {
        const id = readSelection(window.location.hash, key);
        return id && isKnown(id) ? id : null;
    }, [key, isKnown]);
    const [id, setId] = useState<string | null>(read);
    useEffect(() => {
        const onHash = () => {
            if (window.location.hash.startsWith("#sc-source-")) return;
            setId(read());
        };
        window.addEventListener("hashchange", onHash);
        return () => window.removeEventListener("hashchange", onHash);
    }, [read]);
    const select = useCallback(
        (next: string | null) => {
            const valid = next && isKnown(next) ? next : null;
            setId(valid);
            const { pathname, search } = window.location;
            window.history.replaceState(window.history.state, "", `${pathname}${search}${selectionHash(key, valid)}`);
        },
        [key, isKnown],
    );
    return [id, select];
}
