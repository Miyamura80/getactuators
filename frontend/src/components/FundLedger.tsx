import { type ReactNode, useState } from "react";
import {
    COMPANIES,
    companyOf,
    type Deal,
    type Fund,
    FUNDS,
    KIND_LABEL,
    type Kind,
    kindRank,
    type Tier,
    tierOf,
} from "../../../src/investors";
import { CompanyLogo } from "./CompanyLogo";

// One 2017-2026 track per fund, grouped by strongest bet in the active kinds.
// Funds with nothing in view sit first, as hatched bars; that group folds.

const Y0 = 2017;
const Y1 = 2027;
const NOW = 2026.8; // October 2026
const L = 190;
const R = 110;
const W = 1040;
const RH = 26;
const HEAD = 34;
const TOP = 34;

export const TIER_COLOR: Record<Tier, string> = {
    direct: "var(--inv-direct)",
    adj: "var(--inv-adj)",
    hw: "var(--inv-hw)",
    none: "var(--inv-out)",
};
const KIND_NOUN: Record<Kind, string> = {
    direct: "actuator makers",
    adj: "robot makers with own actuators",
    hw: "robot hardware",
};
const GROUP_LABEL: Record<Kind, string> = {
    hw: "ROBOT HARDWARE ONLY",
    adj: "BUILDS OWN ACTUATORS",
    direct: "ACTUATOR MAKERS",
};

const sx = (yr: number) => L + ((yr - Y0) / (Y1 - Y0)) * (W - L - R);
// Names that fit in the folded bar (about 7px a character at 12.5px), then "+N more".
function fitNames(names: string[], width: number): string {
    const sep = "  ·  ";
    let out = "";
    for (const [i, n] of names.entries()) {
        const next = out ? `${out}${sep}${n}` : n;
        const rest = names.length - i - 1;
        if ((next.length + (rest ? 10 : 0)) * 7 > width) return `${out}${sep}+${names.length - i} more`;
        out = next;
    }
    return out;
}
const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");
// Logo slot left of a fund name in the ledger; the name moves right by LOGO_DX.
const LOGO = 16;
const LOGO_DX = 22;
function LedgerLogo({ name, cy }: { name: string; cy: number }) {
    return (
        <foreignObject x={14} y={cy - LOGO / 2} width={LOGO} height={LOGO}>
            <CompanyLogo name={name} size={LOGO} />
        </foreignObject>
    );
}
const TipHead = ({ name }: { name: string }) => (
    <b className="with-logo">
        <CompanyLogo name={name} size={16} />
        {name}
    </b>
);

interface Tip {
    body: ReactNode;
    x: number;
    y: number;
}

function FundTip({ fund }: { fund: Fund }) {
    if (!fund.deals.length)
        return (
            <>
                <TipHead name={fund.name} />
                <span className="inv-tip-m">No actuated bet found, 2017 to Oct 2026</span>
            </>
        );
    return (
        <>
            <TipHead name={fund.name} />
            <span className="inv-tip-m">{KIND_LABEL[tierOf(fund)]}</span>
            {fund.deals.map((x) => (
                <div className="inv-tip-row" key={`${x.co}${x.round}`}>
                    {companyOf(x).name}
                    {x.lead ? " · led" : ""}
                    <br />
                    <span className="inv-tip-m">
                        {x.round}
                        {x.year ? `, ${x.year}` : ""}
                    </span>
                </div>
            ))}
        </>
    );
}

function DealTip({ fund, deal }: { fund: Fund; deal: Deal }) {
    const c = companyOf(deal);
    return (
        <>
            <TipHead name={c.name} />
            <span className="inv-tip-m">{c.what}</span>
            <div className="inv-tip-row">
                <i className="inv-tip-kind" style={{ background: TIER_COLOR[c.kind] }} />
                {KIND_LABEL[c.kind]}
            </div>
            <div className="inv-tip-row">
                {deal.round}
                {deal.year ? `, ${deal.year}` : ""}
            </div>
            <div className="inv-tip-row">
                {fund.name} <span className="inv-tip-m">{deal.lead ? "led the round" : "joined the round"}</span>
            </div>
            <div className="inv-tip-row inv-tip-m">Source: {deal.source ? hostOf(deal.source) : "press reports"}</div>
        </>
    );
}

export function FundLedger({ active, folded, onFold }: { active: readonly Kind[]; folded: boolean; onFold: () => void }) {
    const [tip, setTip] = useState<Tip | null>(null);
    const allOn = active.length === 3;
    const hover: Hover = (body) => ({
        onPointerEnter: (e: React.PointerEvent) => setTip({ body, x: e.clientX, y: e.clientY }),
        onPointerMove: (e: React.PointerEvent) => setTip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t)),
        onPointerLeave: () => setTip(null),
        onFocus: (e: React.FocusEvent<SVGGElement>) => {
            const r = e.currentTarget.getBoundingClientRect();
            setTip({ body, x: r.right, y: r.top });
        },
        onBlur: () => setTip(null),
    });

    const visible = (f: Fund) => f.deals.filter((x) => active.includes(companyOf(x).kind));
    const firstYear = (f: Fund) => Math.min(...visible(f).map((x) => x.year ?? 9999));
    const side = FUNDS.filter((f) => tierOf(f, active) === "none").sort(
        (a, b) => Number(!a.deals.length) - Number(!b.deals.length) || a.name.localeCompare(b.name),
    );
    const groups = (["hw", "adj", "direct"] as const)
        .filter((k) => active.includes(k))
        .map((k) => ({
            kind: k,
            funds: FUNDS.filter((f) => tierOf(f, active) === k).sort(
                (a, b) => firstYear(a) - firstYear(b) || a.name.localeCompare(b.name),
            ),
        }));
    const sideRows = folded && side.length ? 1 : side.length;
    const H = TOP + (sideRows + groups.reduce((t, g) => t + g.funds.length, 0)) * RH + (groups.length + 1) * HEAD + 24;
    const years = Array.from({ length: Y1 - Y0 }, (_, i) => Y0 + i);
    const sideLabel = allOn ? "ON THE SIDELINES" : "NO BET OF THE SELECTED TYPES";
    let y = TOP;

    const sideHead = (
        <g
            className="inv-fold"
            tabIndex={0}
            role="button"
            aria-expanded={!folded}
            aria-label={`${folded ? "Show" : "Hide"} the ${side.length} funds in this group`}
            onClick={onFold}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onFold();
                }
            }}
        >
            <rect x={0} y={y + 4} width={W} height={26} fill="transparent" />
            <path
                d={folded ? `M14,${y + 12} l5,5 l-5,5` : `M12,${y + 14} l5,5 l5,-5`}
                fill="none"
                stroke="var(--inv-out)"
                strokeWidth={1.6}
            />
            <text x={30} y={y + 22} className="inv-mono inv-group" fill="var(--inv-out)">
                {sideLabel} · {side.length}
                <tspan className="inv-hint" dx={14}>
                    {folded ? "click to expand" : "click to fold"}
                </tspan>
            </text>
        </g>
    );
    y += HEAD;
    const sideTop = y;
    y += sideRows * RH;

    return (
        <>
            <div className="inv-scroll">
                <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Each fund's actuated rounds by year, funds with none listed first">
                    <defs>
                        <pattern id="inv-hatch" width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <line x1={0} y1={0} x2={0} y2={7} stroke="var(--inv-out)" strokeOpacity={0.25} strokeWidth={1.5} />
                        </pattern>
                    </defs>
                    {Array.from({ length: Y1 - Y0 + 1 }, (_, i) => (
                        <line key={i} x1={sx(Y0 + i)} x2={sx(Y0 + i)} y1={TOP - 6} y2={H - 22} stroke="var(--line)" />
                    ))}
                    {years.map((yr) => (
                        <g key={yr} className="inv-mono">
                            <text x={sx(yr + 0.5)} y={TOP - 14} textAnchor="middle" fill="var(--muted)" fontSize={11}>
                                {yr}
                            </text>
                            <text x={sx(yr + 0.5)} y={H - 6} textAnchor="middle" fill="var(--inv-faint)" fontSize={11}>
                                {yr}
                            </text>
                        </g>
                    ))}
                    <text x={W - R + 14} y={TOP - 14} className="inv-mono" fill="var(--muted)" fontSize={11}>
                        ROUNDS
                    </text>

                    {sideHead}
                    {side.length > 0 && (
                        <rect x={0} y={sideTop - 2} width={W} height={sideRows * RH + 4} fill="var(--inv-out)" fillOpacity={0.04} />
                    )}
                    {folded && side.length > 0 ? (
                        <g className="inv-hit" tabIndex={0} {...hover(<SidelineTip funds={side} allOn={allOn} />)}>
                            <text x={14} y={sideTop + RH / 2 + 5} fill="var(--inv-out)" fontSize={14} fontWeight={700}>
                                {side.length} funds
                            </text>
                            <rect x={sx(Y0) + 2} y={sideTop + 5} width={sx(NOW) - sx(Y0) - 4} height={RH - 10} fill="url(#inv-hatch)" stroke="var(--inv-out)" />
                            <text x={sx(Y0) + 12} y={sideTop + RH / 2 + 4.5} fill="var(--text)" fontSize={12.5} fontWeight={600}>
                                {fitNames(side.map((f) => f.name), sx(NOW) - sx(Y0) - 24)}
                            </text>
                            <text x={W - R + 14} y={sideTop + RH / 2 + 5} className="inv-mono" fill="var(--inv-out)" fontSize={14} fontWeight={600}>
                                0
                            </text>
                        </g>
                    ) : (
                        side.map((f, i) => {
                            const top = sideTop + i * RH;
                            const cy = top + RH / 2;
                            const hidden = f.deals.length;
                            const kinds = [...new Set(f.deals.map((x) => companyOf(x).kind))].map((k) => KIND_NOUN[k]);
                            return (
                                <g key={f.name} className="inv-hit" tabIndex={0} {...hover(<FundTip fund={f} />)}>
                                    <rect x={0} y={top} width={W} height={RH} fill="transparent" />
                                    <LedgerLogo name={f.name} cy={cy} />
                                    <text x={14 + LOGO_DX} y={cy + 5} fill="var(--inv-out)" fontSize={15} fontWeight={700}>
                                        {f.name}
                                    </text>
                                    <rect className="inv-mark" x={sx(Y0) + 2} y={top + 5} width={sx(NOW) - sx(Y0) - 4} height={RH - 10} fill="url(#inv-hatch)" stroke="var(--inv-out)" />
                                    {hidden > 0 && (
                                        <text x={sx(Y0) + 12} y={cy + 4.5} fill="var(--muted)" fontSize={11.5}>
                                            Hidden by filter: {hidden} {hidden === 1 ? "round" : "rounds"} in {kinds.join(" and ")}
                                        </text>
                                    )}
                                    <text x={W - R + 14} y={cy + 5} className="inv-mono" fill="var(--inv-out)" fontSize={14} fontWeight={600}>
                                        0
                                    </text>
                                </g>
                            );
                        })
                    )}

                    {groups.map((g) => {
                        const headY = y;
                        y += HEAD + g.funds.length * RH;
                        return (
                            <g key={g.kind}>
                                <text x={14} y={headY + 22} className="inv-mono inv-group" fill="var(--muted)">
                                    {GROUP_LABEL[g.kind]} · {g.funds.length}
                                </text>
                                {g.funds.map((f, i) => (
                                    <FundRow key={f.name} fund={f} deals={visible(f)} top={headY + HEAD + i * RH} hover={hover} />
                                ))}
                            </g>
                        );
                    })}
                </svg>
            </div>
            {tip && <TipBox tip={tip} />}
        </>
    );
}

function SidelineTip({ funds, allOn }: { funds: Fund[]; allOn: boolean }) {
    return (
        <>
            <b>{allOn ? "On the sidelines" : "No bet of the selected types"}</b>
            <div className="inv-tip-row">{funds.map((f) => f.name).join(", ")}</div>
        </>
    );
}

interface HoverProps {
    onPointerEnter: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerLeave: () => void;
    onFocus: (e: React.FocusEvent<SVGGElement>) => void;
    onBlur: () => void;
}
type Hover = (body: ReactNode) => HoverProps;

function FundRow({ fund, deals, top, hover }: { fund: Fund; deals: Deal[]; top: number; hover: Hover }) {
    const cy = top + RH / 2;
    const seen: Record<number, number> = {};
    return (
        <>
            <g className="inv-hit" tabIndex={0} {...hover(<FundTip fund={fund} />)}>
                <rect x={0} y={top} width={sx(Y0) - 4} height={RH} fill="transparent" />
                <LedgerLogo name={fund.name} cy={cy} />
                <text x={14 + LOGO_DX} y={cy + 5} fill="var(--text)" fontSize={13}>
                    {fund.name}
                </text>
            </g>
            <line x1={sx(Y0)} x2={sx(NOW)} y1={cy} y2={cy} stroke="var(--line-strong)" />
            {deals
                .filter((x) => x.year !== null)
                .sort((a, b) => kindRank(companyOf(a).kind) - kindRank(companyOf(b).kind))
                .map((x) => {
                    const yr = x.year as number;
                    const n = seen[yr] ?? 0;
                    seen[yr] = n + 1;
                    const cx = sx(yr + 0.5) + n * 16 - 8;
                    const color = TIER_COLOR[COMPANIES[x.co]?.kind ?? "hw"];
                    return (
                        <g
                            key={`${x.co}${x.round}`}
                            className="inv-hit inv-dot"
                            tabIndex={0}
                            aria-label={`${fund.name}, ${companyOf(x).name}, ${x.round}, ${yr}`}
                            {...hover(<DealTip fund={fund} deal={x} />)}
                        >
                            <circle cx={cx} cy={cy} r={12} fill="transparent" />
                            <circle className="inv-mark" cx={cx} cy={cy} r={5.5} fill={x.lead ? color : "var(--panel)"} stroke={color} strokeWidth={2} />
                        </g>
                    );
                })}
            <text x={W - R + 14} y={cy + 5} className="inv-mono" fill="var(--muted)" fontSize={13}>
                {deals.length}
            </text>
        </>
    );
}

function TipBox({ tip }: { tip: Tip }) {
    // Flip to the other side of the pointer near the viewport edge.
    const left = tip.x + 314 > window.innerWidth ? tip.x - 314 : tip.x + 14;
    const top = tip.y + 200 > window.innerHeight ? tip.y - 200 : tip.y + 14;
    return (
        <div className="inv-tip" style={{ left: Math.max(8, left), top: Math.max(8, top) }}>
            {tip.body}
        </div>
    );
}
