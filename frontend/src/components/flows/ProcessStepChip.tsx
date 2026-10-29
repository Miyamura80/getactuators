// A small link from a BOM node (or anywhere) to the step on /manufacturing
// that makes it. Step ids are the contract between the two pages
// (src/supply-chain/processes/ owns them); the label defaults to the id.

export const MANUFACTURING_PATH = "/manufacturing";

export function stepHref(stepId: string): string {
    return `${MANUFACTURING_PATH}#step=${encodeURIComponent(stepId)}`;
}

export function stepLabel(stepId: string): string {
    const s = stepId.replace(/-/g, " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ProcessStepChip({ stepId, label }: { stepId: string; label?: string }) {
    const text = label ?? stepLabel(stepId);
    return <a className="fk-step" href={stepHref(stepId)} aria-label={`How it is made: ${text}`} title={`How it is made: ${text}`}>
        <svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="2" /><path d="M6 .8v1.8M6 9.4v1.8M.8 6h1.8M9.4 6h1.8M2.3 2.3l1.3 1.3M8.4 8.4l1.3 1.3M2.3 9.7l1.3-1.3M8.4 3.6l1.3-1.3" /></svg>
        <span>{text}</span>
    </a>;
}
