import { DEFAULT_CHAIN, getChain } from "../../../../../src/supply-chain/processes";
import { PRODUCT_ID } from "../../../../../src/supply-chain/processes/layout";

// /manufacturing keeps the chain in the query and the focused step in the
// hash: /manufacturing?chain=magnet#step=jet-milling. The first chain stays
// out of the URL.

export function readChain(search: string): string {
    const id = new URLSearchParams(search).get("chain");
    return id && getChain(id) ? id : DEFAULT_CHAIN;
}

export function writeChain(search: string, id: string): string {
    const q = new URLSearchParams(search);
    if (id === DEFAULT_CHAIN) q.delete("chain");
    else q.set("chain", id);
    const s = q.toString();
    return s ? `?${s}` : "";
}

// Step ids of a chain plus its product node, the targets #step= accepts.
export function isTarget(chainId: string, id: string): boolean {
    const chain = getChain(chainId);
    return Boolean(chain && (id === PRODUCT_ID || chain.steps.some((s) => s.id === id)));
}
