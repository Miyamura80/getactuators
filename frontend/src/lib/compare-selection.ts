import { useEffect, useState } from "react";
import { ACTUATORS } from "./data";

const known: ReadonlyMap<string, (typeof ACTUATORS)[number]> = new Map(ACTUATORS.map(a => [a.id, a]));
export function selectedIds(search: string): string[] {
    const values = new URLSearchParams(search).getAll("compare");
    if (values.length !== 1 || values[0].length > 512) return [];
    const ids = values[0].split(",");
    if (ids.length > 4 || ids.some(id => !known.has(id)) || new Set(ids).size !== ids.length) return [];
    return ids.sort();
}
export function compareHref(ids: string[]): string {
    const valid = selectedIds(`?compare=${encodeURIComponent(ids.join(","))}`);
    return valid.length ? `/compare?compare=${valid.join(",")}` : "/compare";
}
export function compareEvent(action: "open" | "update", ids: string[]) {
    const valid = selectedIds(`?compare=${encodeURIComponent(ids.join(","))}`);
    if (action === "open" && valid.length < 2) return;
    if (ids.length && valid.length !== ids.length) return;
    window.dispatchEvent(new CustomEvent("actuatorlist:compare", { detail: { action, productIds: valid } }));
}
export function useCompareSelection() {
    const [ids, setIds] = useState<string[]>([]);
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const restore = () => { setIds(selectedIds(window.location.search)); setReady(true); };
        restore();
        window.addEventListener("popstate", restore);
        return () => window.removeEventListener("popstate", restore);
    }, []);
    const update = (next: string[]) => {
        const valid = selectedIds(`?compare=${encodeURIComponent(next.join(","))}`);
        const params = new URLSearchParams(window.location.search);
        if (valid.length) params.set("compare", valid.join(","));
        else params.delete("compare");
        const q = params.toString();
        window.history.pushState(window.history.state, "", `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash}`);
        setIds(valid);
    };
    const toggle = (id: string) => {
        if (!known.has(id)) return;
        if (ids.includes(id)) update(ids.filter(value => value !== id));
        else if (ids.length < 4) update([...ids, id]);
    };
    const rows = ids.flatMap(id => {
        const row = known.get(id);
        return row ? [row] : [];
    });
    return { ids, ready, toggle, update, rows };
}
