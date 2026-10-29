import type { Person } from "../../../../src/people";
import { PersonCard } from "./PersonCard";
import "./people.css";

// A labelled group of person cards: a mono heading with the count, then the grid.
export function PeopleGrid({ label, people }: { label: string; people: Person[] }) {
    return (
        <section className="pg" aria-label={label}>
            <h2 className="pg-label">
                {label}
                <span>{people.length}</span>
            </h2>
            <div className="pg-grid">
                {people.map((p) => (
                    <PersonCard key={p.id} person={p} />
                ))}
            </div>
        </section>
    );
}
