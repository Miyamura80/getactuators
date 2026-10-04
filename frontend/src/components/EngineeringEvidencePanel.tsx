import { engineeringEvidenceFor } from "../../../src/catalog/engineering-evidence";

const STATUS = { manufacturer: "Manufacturer document", research: "Exploratory report", unknown: "Unknown" };
// These gaps apply to the three reviewed dossiers, not to actuator performance.
const LIMITS = {
    efficiency: "Bus-to-output map: unknown",
    thermal: "Repeated duty / recovery: unknown",
    precision: "Loaded accuracy / repeatability: unknown",
    modeling: "Validated model: unknown",
};

const TOPICS = [
    { key: "efficiency", label: "Efficiency", path: "M4 12h14m-4-4 4 4-4 4M6 5v3m0 8v3" },
    { key: "thermal", label: "Thermal duty", path: "M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0Zm2-7v10m5-8h3m-3 4h2" },
    { key: "precision", label: "Loaded precision", path: "M12 3v4m0 10v4M3 12h4m10 0h4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-1 5h2" },
    { key: "modeling", label: "Modeling", path: "m12 3 8 5v8l-8 5-8-5V8l8-5Zm0 9v9M4 8l8 4 8-4M8 5l8 5" },
] as const;

export function EngineeringEvidencePanel({ id, compact = false }: { id: string; compact?: boolean }) {
    const evidence = engineeringEvidenceFor(id);
    const Heading = compact ? "h3" : "h2";
    const TopicHeading = compact ? "h4" : "h3";
    return <section className={`engineering-evidence${compact ? " engineering-evidence--compact" : ""}`} aria-label="Engineering evidence" data-actuator-id={id}>
        <header><Heading>Engineering evidence</Heading>{!compact && <p>Unknown is not zero. Document evidence, not lab validation.</p>}</header>
        {evidence && <p className="engineering-revision">{evidence.revision}</p>}
        <div className="engineering-grid">
            {TOPICS.map(topic => {
                const item = evidence?.topics[topic.key];
                const status = item?.status ?? "unknown";
                return <article className="engineering-card" key={topic.key} data-topic={topic.key} data-status={status}>
                    <div className="engineering-topic">
                        <svg role="img" aria-label={`${topic.label} topic`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={topic.path} /></svg>
                        <TopicHeading>{topic.label}</TopicHeading>
                    </div>
                    <span className="engineering-status">{STATUS[status]}</span>
                    <p className="engineering-gap">{LIMITS[topic.key]}</p>
                    {!compact && <p className="engineering-summary">{item?.summary ?? "No reviewed model-specific evidence."}</p>}
                    <details>
                        <summary>Scope & sources</summary>
                        {compact && <p className="engineering-summary">{item?.summary ?? "No reviewed model-specific evidence."}</p>}
                        <p>{item?.scope ?? "Not established in the reviewed sources."}</p>
                        {!!item?.sources.length && <ul className="engineering-sources">{item.sources.map(source => <li key={`${source.url}-${source.locator}`}>
                            <a href={source.url}>{source.label}</a><small>{source.locator}</small>
                        </li>)}</ul>}
                    </details>
                </article>;
            })}
        </div>
        {!!evidence?.warnings.length && <details className="engineering-limits"><summary>Revision & review limits</summary>{evidence.warnings.map(warning => <p key={warning}>{warning}</p>)}</details>}
    </section>;
}
