import { getBomCase } from "../../../../../src/supply-chain/bom";
import { bomSlugOf } from "../../../../../src/supply-chain/bom/path";
import { usePath } from "../../../lib/router";
import { BomCasePage } from "./BomCasePage";
import { BomIndex } from "./BomIndex";
import "../../tools.css";
import "../../../components/supply-chain/supply-chain.css";
import "./bom.css";

// /bom and /bom/<slug>. Loaded in its own chunk: the cases carry their 3D
// scene specs.
export function Bom({ menuOpen = false }: { menuOpen?: boolean }) {
    const path = usePath();
    const slug = bomSlugOf(path);
    const c = slug ? getBomCase(slug) : undefined;
    return c ? <BomCasePage key={c.slug} c={c} menuOpen={menuOpen} /> : <BomIndex menuOpen={menuOpen} />;
}
