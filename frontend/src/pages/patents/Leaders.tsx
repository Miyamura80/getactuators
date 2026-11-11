import {
    CAGR_END,
    CAGR_START,
    type LandscapeScope,
    countryTotals,
    leaderboard,
    top5Share,
} from "../../../../src/patents";
import type { Shares } from "../../../../src/supply-chain/concentration";
import { getCompany } from "../../../../src/supply-chain/registry";
import { ConcentrationBadge } from "../../components/flows/ConcentrationBadge";
import { Flag } from "../../components/Flag";
import { liveCountryPage } from "../../components/maps/Arcs";

// Top 15 first assignees for the scope: families as a bar, share, and
// growth over the last three fully published years.

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const growth = (v: number | null) => (v === null ? "n/a" : `${v >= 0 ? "+" : ""}${(v * 100).toFixed(0)}%`);

function AssigneeName({ name, company }: { name: string; company?: string }) {
    const c = company ? getCompany(company) : undefined;
    const page = c ? liveCountryPage(c.hqCountry) : undefined;
    return page ? <a href={`${page}?company=${encodeURIComponent(company as string)}`}>{name}</a> : <>{name}</>;
}

export function Leaders({ scope }: { scope: LandscapeScope }) {
    const rows = leaderboard(scope);
    const max = Math.max(1, ...rows.map((r) => r.families));
    return <div className="pt-leaders">
        <div className="pt-stats">
            <span><b>{pct(top5Share(scope))}</b> held by the top 5</span>
            <ConcentrationBadge shares={countryTotals(scope) as Shares} />
        </div>
        <div className="pt-table-wrap">
            <table className="pt-table">
                <thead><tr>
                    <th scope="col">#</th>
                    <th scope="col">Assignee</th>
                    <th scope="col" className="pt-num">Families</th>
                    <th scope="col" className="pt-num">Share</th>
                    <th scope="col" className="pt-num" title={`Compound growth of priority-year families, ${CAGR_START} to ${CAGR_END}`}>CAGR {String(CAGR_START).slice(2)}-{String(CAGR_END).slice(2)}</th>
                </tr></thead>
                <tbody>{rows.map((r) => <tr key={r.key}>
                    <td className="pt-rank">{r.rank}</td>
                    <td className="pt-who">
                        {r.country !== "XX" ? <Flag code={r.country} /> : null}
                        <AssigneeName name={r.name} company={r.company} />
                    </td>
                    <td className="pt-num">
                        <span className="pt-bar" style={{ width: `${(r.families / max) * 100}%` }} aria-hidden="true" />
                        <span className="pt-bar-n">{r.families}</span>
                    </td>
                    <td className="pt-num">{pct(r.share)}</td>
                    <td className={`pt-num${r.cagr !== null && r.cagr < 0 ? " is-down" : ""}`}>{growth(r.cagr)}</td>
                </tr>)}</tbody>
            </table>
        </div>
    </div>;
}
