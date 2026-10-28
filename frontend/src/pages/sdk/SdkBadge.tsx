import { sdkForActuator } from "../../../../src/sdk";
import { fmtScore } from "./shared";

// Small link from an actuator page to its brand's row on /sdk.
export function SdkBadge({ id, comm }: { id: string; comm: string[] | null }) {
    const sdk = sdkForActuator(id, (comm ?? []).length > 0);
    if (!sdk) return null;
    return <a className="sdk-badge" href={sdk.url} title={`${sdk.name} SDK score ${fmtScore(sdk.score)} of 10, rank ${sdk.rank} of ${sdk.of}`}
        style={{ display: "inline-flex", gap: 6, alignItems: "center", marginTop: 6, padding: "3px 8px", border: "1px solid var(--line-strong)", font: "600 11px var(--mono)", color: "var(--text)", textDecoration: "none" }}>
        <span style={{ color: "var(--muted)" }}>SDK</span>
        <span style={{ color: "var(--cyan)" }}>{fmtScore(sdk.score)}</span>
        <span style={{ color: "var(--muted)" }}>#{sdk.rank}/{sdk.of}</span>
    </a>;
}
