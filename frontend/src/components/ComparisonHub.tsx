import { COMPARISON_METHOD, comparisonSnapshot, comparisonTitle } from "../../../src/catalog/comparison-registry";
import { ACTUATORS } from "../lib/data";
import { COMPARISON_PHOTO_NOTE, comparisonPhotoAlt, comparisonHubNumbers } from "../../../src/catalog/compare";
import { CATEGORIES } from "../types";

const categoryLabel = (slug: string) => CATEGORIES.find(category => category.slug === slug)?.label ?? slug;
const production = comparisonSnapshot(ACTUATORS);
export function ComparisonHub({ records = ACTUATORS }: { records?: typeof ACTUATORS }) {
    const snapshot = records === ACTUATORS ? production : comparisonSnapshot(records);
    const groups = snapshot.groups;
    return <section className="comparison-hub" aria-label="Actuator comparison directory">
        <p>Browse exact catalog models by drive type, or <a href="/actuators">pick 2–4 models in the gallery</a>. Match voltage, packaging and duty requirements before shortlisting.</p>
        {snapshot.authored.length > 0 && <h2>Source-scoped engineering comparison</h2>}
        {snapshot.authored.map(pair => <article className="comparison-feature" key={pair.path}>
            <h3><a href={pair.path}>{pair.title}</a></h3>
            <div className="comparison-feature-photos">{pair.ids.map(id => {
                const a = records.find(a => a.id === id);
                if (!a) return null;
                return <a href={`/actuators/${id}`} key={id}>
                    {a.image_url ? <img src={a.image_url} alt={comparisonPhotoAlt(a)} width={320} height={320} /> : "Photo unavailable"}
                    <span>{a.name}</span>
                </a>;
            })}</div>
            <p>{COMPARISON_PHOTO_NOTE}</p>
            <p>Reviewed documentation, revision conflicts and explicit unknowns. Not a matched bench test.</p>
        </article>)}
        <nav aria-label="Comparison drive categories">{groups.map(group => <a href={`#compare-${group.category}`} key={group.category}>{categoryLabel(group.category)}</a>)}</nav>
        {groups.map(group => <section id={`compare-${group.category}`} tabIndex={-1} key={group.category}>
            <h2>{categoryLabel(group.category)} comparisons</h2>
            <ul className="comparison-links">{group.pairs.map(pair => <li key={pair.path}>
                <a href={pair.path}>{comparisonTitle(pair, records)}</a>
                <p>{pair.ids.map(id => {
                    const a = records.find(a => a.id === id);
                    if (!a) return null;
                    return <span key={id}>{a.name}: {comparisonHubNumbers(a)}<br /></span>;
                })}(catalog values)</p>
            </li>)}</ul>
        </section>)}
        <details className="comparison-method"><summary>How pairs are selected</summary><p>{COMPARISON_METHOD}</p><a href="/guides/robot-actuator-selection">Actuator selection guide</a></details>
    </section>;
}
