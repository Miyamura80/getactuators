import { useEffect, useState } from "react";
import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";
import { FundLedger, TIER_COLOR } from "../components/FundLedger";
import {
    companyOf,
    FUNDS,
    INVESTORS_AS_OF,
    INVESTORS_PATH,
    KIND_LABEL,
    KINDS,
    type Kind,
    sidelineFunds,
    tierOf,
} from "../../../src/investors";
import "./tools.css";
import "./investors.css";

const TITLE = "Actuator investors";
const PRESETS: { label: string; kinds: Kind[] }[] = [
    { label: "All bets", kinds: ["direct", "adj", "hw"] },
    { label: "Pure-play actuators", kinds: ["direct"] },
    { label: "Robot makers", kinds: ["adj", "hw"] },
    { label: "Actuators incl. in-house", kinds: ["direct", "adj"] },
];
const TOGGLE_LABEL: Record<Kind, string> = {
    direct: "Actuator maker (pure-play)",
    adj: "Robot maker, own actuators",
    hw: "Robot hardware, actuators not confirmed",
};
const COUNT_LABEL: Record<Kind, string> = {
    hw: "backed robot hardware, but nothing that makes its own actuators",
    adj: "backed a robot maker that builds its own actuators",
    direct: "backed an actuator maker outright",
};
// Text needs a lighter step than the dark robot-hardware fill.
const COUNT_COLOR: Record<Kind, string> = { hw: "#6f9e9b", adj: "var(--inv-adj)", direct: "var(--inv-direct)" };
const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

export function Investors({ menuOpen = false }: { menuOpen?: boolean }) {
    const [active, setActive] = useState<Kind[]>([...KINDS]);
    const [folded, setFolded] = useState(false);
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => {
            document.title = prev;
        };
    }, []);

    const out = sidelineFunds();
    const inView = sidelineFunds(active).length;
    const toggle = (k: Kind) =>
        setActive((cur) => (cur.includes(k) ? (cur.length > 1 ? cur.filter((x) => x !== k) : cur) : KINDS.filter((x) => x === k || cur.includes(x))));
    const same = (kinds: Kind[]) => kinds.length === active.length && kinds.every((k) => active.includes(k));

    return (
        <div className="tool-page inv-page">
            <PublicHeader path={INVESTORS_PATH} initialOpen={menuOpen} />
            <main className="tool-main">
                <header className="tool-head">
                    <p className="tool-kicker">Investors</p>
                    <h1>
                        Which top funds are <em>still on the sidelines</em> of actuation?
                    </h1>
                    <p className="tool-lede">
                        29 venture funds, checked for any round in hardware that moves: actuator makers, robots built on
                        their own actuators, or robot hardware. Built from public funding announcements as of{" "}
                        {INVESTORS_AS_OF}.
                    </p>
                </header>

                <section className="inv-bench" aria-label="Summary">
                    <div className="inv-out">
                        <div className="inv-n">{out.length} of 29</div>
                        <p>have no actuated bet on record: no actuator maker, no robot hardware.</p>
                        <div className="inv-names">
                            {out.map((f) => (
                                <span key={f.name}>{f.name}</span>
                            ))}
                        </div>
                    </div>
                    <div className="inv-in">
                        {(["hw", "adj", "direct"] as const).map((k) => (
                            <div key={k}>
                                <b style={{ color: COUNT_COLOR[k] }}>{FUNDS.filter((f) => tierOf(f) === k).length}</b>
                                <span>{COUNT_LABEL[k]}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <p className="inv-how">
                    Every dot is a round in hardware that moves: hover or tab to one for the company and the round.
                    Filled dots are rounds the fund led. Switch company types on and off to compare pure-play actuator
                    makers with robot makers; funds with nothing left in view move to the top.
                </p>
                <div className="inv-presets" role="group" aria-label="Show">
                    {PRESETS.map((p) => (
                        <button key={p.label} type="button" aria-pressed={same(p.kinds)} onClick={() => setActive(p.kinds)}>
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="inv-key" aria-label="Legend and filters">
                    {KINDS.map((k) => (
                        <button key={k} type="button" aria-pressed={active.includes(k)} onClick={() => toggle(k)}>
                            <i className="inv-k" style={{ background: TIER_COLOR[k] }} />
                            {TOGGLE_LABEL[k]}
                        </button>
                    ))}
                    <span className="inv-sep">
                        <i className="inv-k inv-led" />
                        Fund led the round
                    </span>
                    <span>
                        <i className="inv-k inv-joined" />
                        Fund joined the round
                    </span>
                    <span className="inv-sep">
                        <i className="inv-k inv-hatch" />
                        No bet of the shown types
                    </span>
                </div>
                <p className="inv-note-line">
                    {inView} of 29 funds have no bet {active.length === KINDS.length ? "of any type" : "of the selected types"}.
                </p>

                <FundLedger active={active} folded={folded} onFold={() => setFolded((f) => !f)} />

                <details className="inv-sources">
                    <summary>Deals and sources</summary>
                    <div className="inv-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Fund</th>
                                    <th>Company</th>
                                    <th>Type</th>
                                    <th>Round</th>
                                    <th>Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                {FUNDS.flatMap((f) =>
                                    f.deals.length
                                        ? f.deals.map((x) => (
                                              <tr key={`${f.name}${x.co}${x.round}`}>
                                                  <td>{f.name}</td>
                                                  <td>
                                                      {companyOf(x).name}
                                                      {x.lead && <span className="inv-lead">LEAD</span>}
                                                  </td>
                                                  <td>{KIND_LABEL[companyOf(x).kind]}</td>
                                                  <td>
                                                      {x.round}
                                                      {x.year ? `, ${x.year}` : ""}
                                                  </td>
                                                  <td>
                                                      {x.source ? (
                                                          <a href={x.source} target="_blank" rel="noopener">
                                                              {hostOf(x.source)}
                                                          </a>
                                                      ) : (
                                                          "press reports"
                                                      )}
                                                  </td>
                                              </tr>
                                          ))
                                        : [
                                              <tr key={f.name}>
                                                  <td>{f.name}</td>
                                                  <td colSpan={4} className="inv-none">
                                                      No actuated round found
                                                  </td>
                                              </tr>,
                                          ],
                                )}
                            </tbody>
                        </table>
                    </div>
                </details>
                <p className="inv-method">
                    "No actuated bet" means public announcements and press did not name the fund in a round for an
                    actuator maker or a robot hardware company. Paid databases (PitchBook, Crunchbase) were not checked,
                    so small or undisclosed checks can be missing. "Robot hardware only" covers robot makers where nothing
                    public says they build their own actuators. Mind Robotics counts as building its own actuators on the
                    strength of job postings for engineers who design and productionize them. HongShan (formerly Sequoia China) led a round in
                    joint-actuator maker RobStride but has been a separate firm from Sequoia since 2023, so it is not
                    counted.
                </p>
            </main>
            <PublicFooter />
        </div>
    );
}
