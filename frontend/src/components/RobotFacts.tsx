import type { Robot, RobotAvailability } from "../types";

const AVAILABILITY: Record<RobotAvailability, string> = {
    shipping: "Shipping",
    preorder: "Pre-order",
    quote_only: "Quote only",
    discontinued: "Discontinued",
};

const OPEN_PARTS: { key: keyof NonNullable<Robot["openness"]>; label: string; title: string }[] = [
    { key: "cad", label: "CAD", title: "Mechanical CAD published" },
    { key: "urdf", label: "URDF", title: "URDF or MJCF sim model published" },
    { key: "sdk", label: "SDK", title: "Control SDK source published" },
    { key: "bom", label: "BOM", title: "Bill of materials published" },
];

// Buying and openness facts for one robot card: whether it can be bought,
// whose actuators it runs on, and which build files the maker publishes.
export function RobotFacts({ robot }: { robot: Robot }) {
    const { availability, actuator_sourcing, openness, lead_time } = robot;
    if (!availability && !openness) return null;
    return (
        <div className="robot-facts">
            {availability && (
                <span className="robot-chip" data-tone={availability}>
                    {AVAILABILITY[availability]}
                    {lead_time && <em> · {lead_time}</em>}
                </span>
            )}
            {actuator_sourcing && (
                <span className="robot-chip">
                    {actuator_sourcing === "in_house" ? "In-house actuators" : "Off-the-shelf actuators"}
                </span>
            )}
            {openness && (
                <span className="robot-open" aria-label="Published build files">
                    {OPEN_PARTS.map((p) => (
                        <span
                            key={p.key}
                            className="robot-open-part"
                            data-on={openness[p.key]}
                            title={`${p.title}: ${openness[p.key] ? "yes" : "no"}`}
                        >
                            {p.label}
                        </span>
                    ))}
                </span>
            )}
        </div>
    );
}
