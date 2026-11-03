import { sdkScoreForActuator } from "../../../src/sdk";
import "../pages/sdk/sdk.css";

// Small SDK verdict on an actuator page, linking to the brand on /sdk.
// Renders nothing for reducers and bare motors (no software to score).
export function SdkBadge({ actuatorId }: { actuatorId: string }) {
    const s = sdkScoreForActuator(actuatorId);
    if (!s) return null;
    return <a className="sdk-badge" href={s.url} aria-label={`${s.brandName} SDK score ${Math.round(s.overall)} of 100, rank ${s.rank} of ${s.of}`}>
        SDK <b>{Math.round(s.overall)}</b> · #{s.rank} of {s.of}
    </a>;
}
