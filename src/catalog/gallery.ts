// Dependency-neutral gallery grouping: the browser and server must select the
// same leading card. Preserve catalog order for ties within each section.
interface GalleryActuator {
    id: string;
    category: string;
    use_cases: readonly string[];
    torque_density_nm_per_kg: number | null;
    peak_torque_nm: number | null;
    image_url?: string | null;
}

export type GallerySize = "lg" | "wide" | "sm";
export type GalleryGrouping = "type" | "application";

interface GroupDef {
    key: string;
    label: string;
    blurb: string;
}

// Actuator architectures, ordered from dynamic legged joints to hobby servos.
export const TYPE_GROUPS: readonly GroupDef[] = [
    {
        key: "qdd_proprioceptive",
        label: "QDD / Proprioceptive",
        blurb: "Low-ratio, backdrivable joints that sense force through motor current.",
    },
    {
        key: "integrated_joint",
        label: "Integrated joints",
        blurb: "Motor, gearbox, encoder and driver in one sealed module.",
    },
    {
        key: "cycloidal_premium",
        label: "Cycloidal / Premium",
        blurb: "Shock-tolerant reducers with high stiffness and long life.",
    },
    {
        key: "harmonic_precision",
        label: "Harmonic / Precision",
        blurb: "Zero-backlash strain-wave gearing for accurate positioning.",
    },
    {
        key: "frameless_driver",
        label: "Frameless + driver",
        blurb: "Bare stator and rotor kits you build into your own housing.",
    },
    {
        key: "smart_servo",
        label: "Smart servos",
        blurb: "Small networked servos with a built-in controller.",
    },
];

// Raw use_case tags are inconsistent, so roll them up into a few buckets.
// robot_arm is on nearly every part, so it never decides a bucket on its own.
const APPLICATION_TAGS: Record<string, readonly string[]> = {
    legged: ["quadruped_leg", "legged_robot"],
    humanoid: ["humanoid_joint", "humanoid"],
    exoskeleton: ["exoskeleton", "mobility"],
    arms: [
        "cobot_joint",
        "cobot_arm",
        "cobot",
        "heavy_arm",
        "swing_arm_manipulator",
        "small_joint",
        "direct_drive_joint",
    ],
    industrial: [
        "industrial_robot_joint",
        "industrial",
        "industrial_servo",
        "industrial_automation",
        "assembly_automation",
        "machine_tool",
        "agv",
        "heavy_positioning",
    ],
    precision: [
        "surgical_robotics",
        "medical_robotics",
        "semiconductor",
        "positioning_stage",
        "gimbal",
    ],
    hobby: ["diy_qdd"],
};
const FALLBACK_APPLICATION = "hobby";

export const APPLICATION_GROUPS: readonly GroupDef[] = [
    {
        key: "legged",
        label: "Legged robots",
        blurb: "Quadruped and biped legs: torque density and impact tolerance first.",
    },
    {
        key: "humanoid",
        label: "Humanoids",
        blurb: "Hip, knee, shoulder and elbow joints for full-size humanoids.",
    },
    {
        key: "exoskeleton",
        label: "Exoskeletons & mobility",
        blurb: "Light, backdrivable joints that work safely against a person.",
    },
    {
        key: "arms",
        label: "Cobots & robot arms",
        blurb: "Collaborative and heavy-payload arm joints.",
    },
    {
        key: "industrial",
        label: "Industrial automation",
        blurb: "Robot cells, AGVs, machine tools and assembly lines.",
    },
    {
        key: "precision",
        label: "Precision & medical",
        blurb: "Surgical robots, semiconductor stages and gimbals.",
    },
    {
        key: "hobby",
        label: "Hobby, DIY & education",
        blurb: "Open-source builds, small arms and teaching robots.",
    },
];

export function applicationsOf(a: Pick<GalleryActuator, "use_cases">): string[] {
    const keys = APPLICATION_GROUPS.map((g) => g.key).filter((key) =>
        a.use_cases.some((u) => APPLICATION_TAGS[key]?.includes(u)),
    );
    return keys.length ? keys : [FALLBACK_APPLICATION];
}

export interface GallerySection<T> {
    key: string;
    label: string;
    blurb: string;
    cards: { a: T; size: GallerySize }[];
}

// Strongest torque density first; parts without a figure keep catalog order last.
function byDensity<T extends GalleryActuator>(list: T[]): T[] {
    return list
        .map((a, i) => ({ a, i }))
        .sort(
            (x, y) =>
                (y.a.torque_density_nm_per_kg ?? -1) -
                    (x.a.torque_density_nm_per_kg ?? -1) || x.i - y.i,
        )
        .map(({ a }) => a);
}

export function galleryGroups<T extends GalleryActuator>(
    actuators: readonly T[],
    by: GalleryGrouping = "type",
): GallerySection<T>[] {
    const defs = by === "type" ? TYPE_GROUPS : APPLICATION_GROUPS;
    const member = (a: T, key: string) =>
        by === "type" ? a.category === key : applicationsOf(a).includes(key);
    return defs
        .map((def) => ({
            ...def,
            // The section leader gets a double-width tile; the rest are uniform.
            cards: byDensity(actuators.filter((a) => member(a, def.key))).map(
                (a, i): { a: T; size: GallerySize } => ({
                    a,
                    size: i === 0 ? "wide" : "sm",
                }),
            ),
        }))
        .filter((s) => s.cards.length > 0);
}

// Flat default (by type) order, shared by the server preload and the SPA.
export function galleryCards<T extends GalleryActuator>(actuators: readonly T[]) {
    return galleryGroups(actuators, "type").flatMap((s) => s.cards);
}
