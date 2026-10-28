// The technologies /patents tracks, each scoped by a set of CPC codes plus
// optional keyword filters on the English title and abstract. The fetch
// script (scripts/patents/fetch.ts) turns these into the committed BigQuery
// queries, so this file is the only place the scope is defined.
//
// match "prefix" takes the symbol and every symbol that extends it
// (F16H1/28 also takes F16H1/2809); "exact" takes that symbol only, for a
// parent group whose subgroups belong to another technology.
//
// Keyword filters apply per code: a family matches a code when it carries
// the symbol and, if `keywords` is set, its title or abstract matches one of
// them. Generic gearing and screw codes need the robot filter; codes that only
// exist for the technology (wave gearing, R-Fe-B magnets) do not.

export interface CpcCode {
    code: string;
    match: "prefix" | "exact";
    title: string;
    rationale: string;
    keywords?: readonly string[];
}

export interface Technology {
    id: string;
    label: string;
    short: string;
    description: string;
    cpc: readonly CpcCode[];
}

// Title or abstract words that tie a generic mechanism to robots and
// actuators. Matched case-insensitively as whole-word regular expressions.
export const ROBOT_TERMS = [
    "robot",
    "robotic",
    "manipulator",
    "humanoid",
    "exoskeleton",
    "legged",
    "joint actuator",
    "rotary actuator",
    "linear actuator",
] as const;

const MUSCLE_TERMS = [
    "artificial muscle",
    "dielectric elastomer",
    "hasel",
    "electrohydraulic",
    "soft actuator",
] as const;

export const TECHNOLOGIES: readonly Technology[] = [
    {
        id: "robot-joints",
        label: "Robot joints and integrated actuators",
        short: "Robot joints",
        description:
            "Electric drive units for manipulator and legged-robot joints: motor, reducer, brake and encoder in one housing.",
        cpc: [
            {
                code: "B25J9/102",
                match: "prefix",
                title: "Manipulator positioning means: gears specially adapted therefor",
                rationale:
                    "The reducer inside a robot joint, classified from the robot side.",
            },
            {
                code: "B25J9/12",
                match: "prefix",
                title: "Manipulator positioning means: electric",
                rationale:
                    "Electric joint drives, including rotary actuators (B25J9/126).",
            },
            {
                code: "B25J17/0241",
                match: "prefix",
                title: "Wrist joints: one-dimensional joints",
                rationale: "Single-axis joint modules filed as joints.",
            },
            {
                code: "H02K7/116",
                match: "prefix",
                title: "Motors structurally associated with gears",
                rationale:
                    "Gearmotors, filed from the motor side; the robot filter keeps out vehicle and appliance drives.",
                keywords: ROBOT_TERMS,
            },
        ],
    },
    {
        id: "strain-wave",
        label: "Strain-wave (harmonic) gears",
        short: "Strain wave",
        description:
            "Flexspline, circular spline and wave generator reducers: near-zero backlash at high ratio in a thin package.",
        cpc: [
            {
                code: "F16H49/001",
                match: "prefix",
                title: "Wave gearings, e.g. harmonic drive transmissions",
                rationale: "The dedicated group for strain-wave gearing.",
            },
        ],
    },
    {
        id: "cycloidal",
        label: "Cycloidal and RV reducers",
        short: "Cycloidal",
        description:
            "Eccentric reducers with an orbiting cycloid disc or crank-driven RV stage, for stiff high-torque joints.",
        cpc: [
            {
                code: "F16H1/32",
                match: "prefix",
                title: "Orbital gearing with the central axis inside the periphery of an orbital gear",
                rationale:
                    "Where eccentric and cycloidal reducers sit in the main scheme.",
            },
            {
                code: "F16H2001/32",
                match: "prefix",
                title: "Indexing codes for orbital gears inside the periphery (cycloid and crank variants)",
                rationale:
                    "The indexing codes that split cycloid-disc and crankshaft (RV) designs.",
            },
        ],
    },
    {
        id: "planetary",
        label: "Planetary gearing for robots",
        short: "Planetary",
        description:
            "Planetary and compound planetary stages used in quasi-direct-drive and geared robot joints.",
        cpc: [
            {
                code: "F16H1/28",
                match: "prefix",
                title: "Toothed gearings with gears having orbital motion",
                rationale: "Planetary gearing in general; only robot filings are kept.",
                keywords: ROBOT_TERMS,
            },
            {
                code: "F16H1/46",
                match: "prefix",
                title: "Systems of several gear trains, each with orbital gears",
                rationale: "Multi-stage planetary reducers.",
                keywords: ROBOT_TERMS,
            },
        ],
    },
    {
        id: "screws",
        label: "Planetary roller screws and ball screws for robots",
        short: "Roller and ball screws",
        description:
            "Screw drives that turn motor rotation into linear force for humanoid legs and linear actuators.",
        cpc: [
            {
                code: "F16H25/22",
                match: "prefix",
                title: "Screw mechanisms with balls, rollers or similar members between nut and screw",
                rationale:
                    "Covers ball screws (F16H25/2204) and planetary roller screws (F16H25/2252); only robot and actuator filings are kept.",
                keywords: ROBOT_TERMS,
            },
        ],
    },
    {
        id: "ndfeb",
        label: "NdFeB magnets",
        short: "NdFeB magnets",
        description:
            "Neodymium-iron-boron compositions, grain boundary diffusion and dysprosium or terbium reduction.",
        cpc: [
            {
                code: "H01F1/057",
                match: "prefix",
                title: "Hard magnetic alloys containing rare earths and IIIa elements, e.g. Nd2Fe14B",
                rationale: "R-Fe-B compositions, sintered (H01F1/0577) and bonded.",
            },
            {
                code: "H01F41/0293",
                match: "prefix",
                title: "Diffusion of rare earth elements, e.g. Tb, into permanent magnets",
                rationale:
                    "Grain boundary diffusion: the main route to less Dy and Tb per magnet.",
            },
            {
                code: "C22C38/005",
                match: "prefix",
                title: "Ferrous alloys containing rare earths",
                rationale:
                    "Composition claims filed from the metallurgy side; only magnet filings are kept.",
                keywords: ["magnet"],
            },
        ],
    },
    {
        id: "ree-free-magnets",
        label: "Rare-earth-free magnets",
        short: "RE-free magnets",
        description:
            "Ferrite and rare-earth-free alloy magnets (MnBi, MnAl, iron nitride, tetrataenite).",
        cpc: [
            {
                code: "H01F1/10",
                match: "exact",
                title: "Hard magnetic non-metallic substances, e.g. ferrites",
                rationale: "Hard ferrite magnets.",
            },
            {
                code: "H01F1/11",
                match: "prefix",
                title: "Hard magnetic non-metallic substances in the form of particles",
                rationale: "Ferrite powders and bonded ferrite.",
            },
            {
                code: "H01F1/047",
                match: "exact",
                title: "Hard magnetic alloys characterised by their composition",
                rationale:
                    "Exact match only: its subgroups hold the rare-earth alloys counted under NdFeB.",
            },
        ],
    },
    {
        id: "ree-free-motors",
        label: "Rare-earth-free motor topologies",
        short: "RE-free motors",
        description:
            "Switched and synchronous reluctance motors, plus axial-flux machines (which may still use NdFeB).",
        cpc: [
            {
                code: "H02K19/103",
                match: "prefix",
                title: "Motors with stator windings and a variable reluctance soft-iron rotor",
                rationale: "Switched reluctance motors.",
            },
            {
                code: "H02K1/246",
                match: "prefix",
                title: "Variable reluctance rotors",
                rationale: "Synchronous reluctance rotor designs.",
            },
            {
                code: "H02K21/24",
                match: "prefix",
                title: "Permanent magnet machines with magnets axially facing the armatures",
                rationale:
                    "Axial-flux machines, tracked as a topology; most still use NdFeB.",
            },
        ],
    },
    {
        id: "artificial-muscles",
        label: "Artificial muscles and electrohydrostatic actuators",
        short: "Artificial muscles",
        description:
            "HASEL, dielectric elastomer, twisted-coiled polymer and SMA actuators, and electrohydrostatic joint drives.",
        cpc: [
            {
                code: "F03G7/06",
                match: "prefix",
                title: "Mechanical power from expansion or contraction of bodies due to heating",
                rationale:
                    "Shape memory alloy and twisted-coiled polymer actuators, which are driven by heat.",
            },
            {
                code: "H10N30/20",
                match: "prefix",
                title: "Piezoelectric or electrostrictive devices with electrical input and mechanical output",
                rationale:
                    "Dielectric elastomer and HASEL actuators; the muscle filter drops piezo stacks and buzzers.",
                keywords: MUSCLE_TERMS,
            },
            {
                code: "B25J9/142",
                match: "prefix",
                title: "Manipulator positioning means: fluid, comprising inflatable bodies",
                rationale: "Fluidic artificial muscles in robots.",
                keywords: MUSCLE_TERMS,
            },
            {
                code: "F15B15/18",
                match: "prefix",
                title: "Fluid-actuated devices: combined units of motor and pump",
                rationale:
                    "Electrohydrostatic actuators (a motor-pump and cylinder in one unit); only robot filings are kept.",
                keywords: ROBOT_TERMS,
            },
        ],
    },
];

export const TECHNOLOGY_IDS = TECHNOLOGIES.map((t) => t.id) as [string, ...string[]];

// Code pairs in different technologies that may match the same symbol on
// purpose. Empty: every technology owns its codes. A family can still fall
// in two technologies when it carries codes from both, and then counts in
// each (a strain-wave joint is both a joint and a gear).
export const ALLOWED_OVERLAPS: readonly (readonly [string, string])[] = [];

const byId = new Map(TECHNOLOGIES.map((t) => [t.id, t]));

export function getTechnology(id: string): Technology | undefined {
    return byId.get(id);
}

// True when a symbol from the data falls under a scoped code.
export function cpcMatches(scope: CpcCode, symbol: string): boolean {
    return scope.match === "exact"
        ? symbol === scope.code
        : symbol.startsWith(scope.code);
}

// Two scoped codes that can match the same symbol.
export function codesOverlap(a: CpcCode, b: CpcCode): boolean {
    if (a.match === "exact" && b.match === "exact") return a.code === b.code;
    if (a.match === "exact") return cpcMatches(b, a.code);
    if (b.match === "exact") return cpcMatches(a, b.code);
    return a.code.startsWith(b.code) || b.code.startsWith(a.code);
}

function codePairs(
    a: Technology,
    b: Technology,
    allowed: ReadonlySet<string>,
): string[] {
    return a.cpc.flatMap((ca) =>
        b.cpc
            .filter(
                (cb) =>
                    codesOverlap(ca, cb) &&
                    !allowed.has([ca.code, cb.code].sort().join(" ")),
            )
            .map((cb) => `${a.id} ${ca.code} / ${b.id} ${cb.code}`),
    );
}

// Code pairs from different technologies that can match the same symbol and
// are not in ALLOWED_OVERLAPS.
export function unintendedOverlaps(
    techs: readonly Technology[] = TECHNOLOGIES,
): string[] {
    const allowed = new Set(ALLOWED_OVERLAPS.map((pair) => [...pair].sort().join(" ")));
    return techs.flatMap((a, i) =>
        techs.slice(i + 1).flatMap((b) => codePairs(a, b, allowed)),
    );
}
