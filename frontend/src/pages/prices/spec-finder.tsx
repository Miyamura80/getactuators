import { useMemo, useState } from "react";
import { type Listing, countries, rank } from "./listings";
import { Matches } from "./matches";
import { CLASSES } from "./shared";
import { type Spec, filtered, positive } from "./url-state";
import { ValueScatter } from "./value-scatter";

// 02: the buyer's search. A spec bar (peak torque, budget, class, country),
// the actuators that meet it ranked by $/Nm, and the whole catalog's price
// against torque with the spec's corner shaded and the best value frontier.
// The spec is part of the page's one query state; the parent owns it.

const numText = (v: number | null) => (v === null ? "" : String(v));

export function SpecFinder({ listings, spec, selected, spark, onSpec }: {
    listings: Listing[];
    spec: Spec;
    // The page's selected actuator ("" for none).
    selected: string;
    spark: string | undefined;
    onSpec: (patch: Partial<Spec>) => void;
}) {
    const [nmText, setNmText] = useState(() => numText(spec.nm));
    const [budgetText, setBudgetText] = useState(() => numText(spec.budget));
    const [hover, setHover] = useState("");
    const ranked = useMemo(() => rank(listings, spec), [listings, spec]);
    const places = useMemo(() => countries(listings), [listings]);
    const focus = listings.find((l) => l.a.id === selected) ?? null;
    const clear = () => {
        setNmText("");
        setBudgetText("");
        onSpec({ nm: null, budget: null, cls: "", country: "" });
    };

    return <>
        <form className="pr-spec" role="search" aria-label="Actuator spec" onSubmit={(e) => e.preventDefault()}>
            <label className="pr-field pr-field-nm">
                <span>Peak torque at least</span>
                <span className="pr-input">
                    <input type="text" inputMode="decimal" autoComplete="off" placeholder="any" value={nmText}
                        onChange={(e) => { setNmText(e.target.value); onSpec({ nm: positive(e.target.value) }); }} />
                    <em>Nm</em>
                </span>
            </label>
            <label className="pr-field">
                <span>Budget at most</span>
                <span className="pr-input">
                    <em>$</em>
                    <input type="text" inputMode="decimal" autoComplete="off" placeholder="any" value={budgetText}
                        onChange={(e) => { setBudgetText(e.target.value); onSpec({ budget: positive(e.target.value) }); }} />
                </span>
            </label>
            <label className="pr-field">
                <span>Class</span>
                <select value={spec.cls} onChange={(e) => onSpec({ cls: e.target.value })}>
                    <option value="">Any class</option>
                    {CLASSES.map((k) => <option key={k.slug} value={k.slug}>{k.label}</option>)}
                </select>
            </label>
            <label className="pr-field">
                <span>Country</span>
                <select value={spec.country} onChange={(e) => onSpec({ country: e.target.value })}>
                    <option value="">Anywhere</option>
                    {places.map((k) => <option key={k.country} value={k.country}>{k.country} ({k.n})</option>)}
                </select>
            </label>
        </form>
        <p className="pr-summary" aria-live="polite">
            <span><b>{ranked.length}</b> of {listings.length} meet the spec</span>
            {filtered(spec) ? <button type="button" className="pr-clear" onClick={clear}>Clear</button> : null}
        </p>
        <div className="pr-tool">
            <Matches ranked={ranked} focus={focus} selected={selected} spark={spark}
                onPick={(id) => onSpec({ actuator: id })} onHover={setHover} />
            <ValueScatter all={listings} matches={ranked} spec={spec} hot={hover || selected}
                onPick={(id) => onSpec({ actuator: id })} />
        </div>
    </>;
}
