import { BOM_PATH, getBomCase } from "../../../../../src/supply-chain/bom";
import { bomSlugOf } from "../../../../../src/supply-chain/bom/path";
import { PublicFooter } from "../../../components/PublicFooter";
import { PublicHeader } from "../../../components/PublicHeader";
import { usePath } from "../../../lib/router";
import { BomCasePage } from "./BomCasePage";
import { BomIndex } from "./BomIndex";
import "../../tools.css";
import "../../../components/supply-chain/supply-chain.css";
import "./bom.css";

// /bom and /bom/<slug>. Loaded in its own chunk: the cases carry their 3D
// scene specs. Any other /bom/<x> gets a not-found state, matching the
// server's 404.
export function Bom({ menuOpen = false }: { menuOpen?: boolean }) {
    const path = usePath();
    const slug = bomSlugOf(path);
    const c = slug ? getBomCase(slug) : undefined;
    if (c) return <BomCasePage key={c.slug} c={c} menuOpen={menuOpen} />;
    if (path === BOM_PATH || path === `${BOM_PATH}/`) return <BomIndex menuOpen={menuOpen} />;
    return <BomMissing menuOpen={menuOpen} />;
}

function BomMissing({ menuOpen }: { menuOpen: boolean }) {
    return <div className="tool-page bm-page">
        <PublicHeader path={BOM_PATH} initialOpen={menuOpen} />
        <main className="tool-main">
            <header className="tool-head bm-head">
                <h1>No such teardown</h1>
                <p className="tool-lede">There is no bill of materials at this address. <a href={BOM_PATH}>See every teardown</a>.</p>
            </header>
        </main>
        <PublicFooter />
    </div>;
}
