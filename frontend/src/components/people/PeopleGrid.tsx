import type { Person } from "../../../../src/people";
import { PersonCard } from "./PersonCard";
import "./people.css";

// A labelled group of person cards: a mono heading with the count, then the
// grid. `core` draws every card at the larger size.
export function PeopleGrid({
    label,
    people,
    core = false,
    showRole,
}: {
    label: string;
    people: Person[];
    core?: boolean;
    showRole?: boolean;
}) {
    return (
        <section className="pg" aria-label={label}>
            <h2 className="pg-label">
                {label}
                <span>{people.length}</span>
            </h2>
            <div className={`pg-grid${core ? " pg-core" : ""}`}>
                {people.map((p) => (
                    <PersonCard key={p.id} person={p} core={core} showRole={showRole} />
                ))}
            </div>
        </section>
    );
}
