import {
    type LandscapeSnapshot,
    googlePatentsUrl,
    searchFamilies,
    technologySnapshot,
} from "../../../../../src/patents/landscape";

// 05. The most recent families of the picked technology, searchable by
// title, assignee, number or country, each linked to Google Patents.

const SHOWN = 25;

export function FamilyList({ tech, q, snapshot, onQuery }: {
    tech: string;
    q: string;
    snapshot: LandscapeSnapshot;
    onQuery: (q: string) => void;
}) {
    const all = technologySnapshot(tech, snapshot)?.topFamilies ?? [];
    const hits = searchFamilies(all, q);
    return <div className="pt-families">
        <input type="search" className="pt-search" aria-label="Search families" placeholder="Search title, assignee, number"
            value={q} onChange={(e) => onQuery(e.target.value)} />
        <p className="pt-note" aria-live="polite">{hits.length} of {all.length}</p>
        <table>
            <thead>
                <tr><th scope="col">Priority</th><th scope="col">Title</th><th scope="col">Assignee</th></tr>
            </thead>
            <tbody>
                {hits.slice(0, SHOWN).map((f) => <tr key={f.familyId}>
                    <td className="pt-num">{f.priorityDate}</td>
                    <td><a href={googlePatentsUrl(f.publication)} target="_blank" rel="noopener noreferrer">{f.title || f.publication}</a></td>
                    <td>{f.assignee}</td>
                </tr>)}
            </tbody>
        </table>
    </div>;
}
