import type { LeaderRow } from "../../../../src/sdk";
import type { CapabilityId } from "../../../../src/sdk/types";

const COLUMNS: [CapabilityId, string][] = [
    ["python", "Python"],
    ["cpp", "C/C++"],
    ["rust", "Rust"],
    ["ros2", "ROS 2"],
    ["ros2_control", "ros2_control"],
    ["urdf", "URDF"],
    ["mjcf", "MJCF"],
    ["open_firmware", "Open firmware"],
    ["documented_protocol", "Protocol doc"],
];

// 07: what exists, official or community, per brand.
export function Capabilities({ rows }: { rows: LeaderRow[] }) {
    return <div className="sdk-scroll" role="region" aria-label="Capability matrix" tabIndex={0}>
        <table className="sdk-caps">
            <thead><tr><th scope="col">Brand</th>{COLUMNS.map(([id, label]) => <th key={id} scope="col">{label}</th>)}</tr></thead>
            <tbody>
                {rows.map((r) => <tr key={r.brand.brand}>
                    <th scope="row">{r.brand.name}</th>
                    {COLUMNS.map(([id, label]) => {
                        const v = r.brand.capabilities[id];
                        return <td key={id} className={v ? `is-${v}` : ""} aria-label={`${label}: ${v ?? "none found"}`}>
                            {v === "official" ? "✓" : v === "community" ? "◐" : "·"}
                        </td>;
                    })}
                </tr>)}
            </tbody>
        </table>
        <p className="sdk-note">✓ official repo · ◐ community repo only · · none found</p>
    </div>;
}
