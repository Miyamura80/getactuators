import { ALT_FAMILIES, ALT_TECHS, type AltFamily, type MagnetUse, deploymentsOf } from "../../../../../src/supply-chain/alts";
import { TechDot, TodayMark } from "./glyphs";
import { radiusFor, stageOf } from "./landscape-model";

// Phone layout of the landscape: one rung per TRL, 9 at the top. The
// magnet axis becomes a short tag on each chip (none when it has no magnets).

const MAGNET_TAG: Record<MagnetUse, string | null> = {
    none: null,
    ferrite: "ferrite",
    "iron-nitride": "iron nitride",
    permanent: "permanent magnet",
    motor: "pump motor",
};

export function Ladder({ hidden, focus, onPick }: {
    hidden: ReadonlySet<AltFamily>;
    focus: string | null;
    onPick: (id: string) => void;
}) {
    const rungs = Array.from({ length: 9 }, (_, i) => 9 - i);
    const order = (f: AltFamily) => ALT_FAMILIES.indexOf(f);
    return <ol className="al-ladder" aria-label="Technologies by readiness level">
        {rungs.map((trl) => {
            const techs = ALT_TECHS.filter((t) => t.trl.value === trl && !hidden.has(t.family)).sort((a, b) => order(a.family) - order(b.family));
            const empty = techs.length === 0 && trl !== 9;
            return <li key={trl} className={`al-rung${empty ? " is-empty" : ""}`}>
                <span className="al-rung-n"><b>{trl}</b><span>{stageOf(trl)}</span></span>
                <span className="al-rung-items">
                    {trl === 9 ? <span className="al-lchip is-baseline"><svg viewBox="-14 -14 28 28" aria-hidden="true"><TodayMark r={7} /></svg>Today: NdFeB</span> : null}
                    {techs.map((t) => {
                        const n = deploymentsOf(t.id).length;
                        const tag = MAGNET_TAG[t.magnets];
                        return <button key={t.id} type="button" className="al-lchip" data-tech={t.id} aria-pressed={focus === t.id} onClick={() => onPick(t.id)}>
                            <svg viewBox="-14 -14 28 28" aria-hidden="true"><TechDot family={t.family} r={radiusFor(n)} deployments={n} /></svg>
                            {t.short}
                            {tag ? <i>{tag}</i> : null}
                        </button>;
                    })}
                    {empty ? <span className="al-gap">none cited</span> : null}
                </span>
            </li>;
        })}
    </ol>;
}
