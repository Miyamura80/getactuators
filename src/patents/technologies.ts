// The technologies on /patents, each a reviewed set of CPC codes. A family
// belongs to a technology when any of its publications carries one of the
// technology's codes (prefix match, so "F16H49/001" also takes its
// sub-groups). Codes marked filtered only count when the family also passes
// the technology's filter: an English title matching one of its keywords, or
// another CPC code from its co-code list. Families matching no technology are
// dropped. A family can belong to several technologies (a harmonic drive
// built into a robot joint is both).
//
// A technology's exclude list drops families whose title matches, whatever
// their codes (iron nitride titles out of NdFeB).
//
// The BigQuery extract (scripts/patents/queries/extract.sql) is a broad CPC
// superset; these sets narrow it. A code outside the superset (H01F1/11,
// F16H2001/323) only sees families the superset caught through another code.
// Method: docs/patents.md. Relative imports only: the browser bundle
// reuses this module.

export interface CpcRule {
    code: string;
    // Why this code is in the set, in a line.
    why: string;
    // Only counts when the family passes the technology filter.
    filtered?: boolean;
}

export interface TechFilter {
    // Case-insensitive regular expression sources matched against the title.
    title: string[];
    // CPC prefixes that pass the filter on their own.
    coCodes?: string[];
}

export interface Technology {
    id: string;
    label: string;
    short: string;
    // What the set covers, one sentence.
    scope: string;
    codes: CpcRule[];
    filter?: TechFilter;
    // Title regular expressions that keep a family out whatever its codes.
    exclude?: string[];
}

const ROBOT_TITLE = [
    "robot",
    "humanoid",
    "manipulator",
    "exoskeleton",
    "joint",
    "\\bactuator",
    "\\barm\\b",
    "\\blegged\\b",
];
const ROBOT_CO = ["B25J", "B62D57/032", "A61H3/00", "A61H1/02"];

export const TECHNOLOGIES = [
    {
        id: "robot-joints",
        label: "Robot joints and integrated actuators",
        short: "Robot joints",
        scope: "Joint modules, drive trains and rotary or linear actuators claimed as parts of a manipulator or legged robot.",
        codes: [
            {
                code: "B25J9/102",
                why: "Manipulator positioning means: gears and reduction gears in the arm (B25J9/1025 harmonic drives also count under strain-wave gears).",
            },
            {
                code: "B25J9/12",
                why: "Electric positioning means, with B25J9/123 linear and B25J9/126 rotary actuators. Often added to whole robots (bin pickers, carts), so the keyword filter applies.",
                filtered: true,
            },
            {
                code: "B25J17/02",
                why: "Wrist joints. Many are cable and linkage layouts, so the joint or actuator keyword filter applies.",
                filtered: true,
            },
            {
                code: "B25J9/104",
                why: "Positioning by cables, chains or ribbons (tendon-driven joints). Keyword filter applies.",
                filtered: true,
            },
        ],
        filter: {
            title: [
                "joint",
                "actuat",
                "reduc",
                "\\bdrive",
                "\\bgear",
                "servo",
                "motor",
                "tendon",
                "transmission",
            ],
        },
    },
    {
        id: "strain-wave",
        label: "Strain-wave (harmonic) gears",
        short: "Strain-wave gears",
        scope: "Wave generators, flexsplines and circular splines, for any machine.",
        codes: [
            {
                code: "F16H49/001",
                why: "Wave gearings, the strain-wave (harmonic drive) group.",
            },
            {
                code: "F16H2049/003",
                why: "Indexing code for features of wave gearings (tooth profile, flexspline shape).",
            },
            {
                code: "B25J9/1025",
                why: "Harmonic drives as manipulator gearing; shared with robot joints on purpose.",
            },
        ],
    },
    {
        id: "cycloidal",
        label: "Cycloidal and RV reducers",
        short: "Cycloidal reducers",
        scope: "Orbital gearing with the central axis inside the orbital gear: cycloidal discs, RV and eccentric reducers.",
        codes: [
            {
                code: "F16H1/32",
                why: "Toothed gearing with orbital gears whose central axis lies inside the orbital gear: cycloidal, RV and eccentric reducers. Also holds engine and antenna mechanisms, so the reducer keyword filter applies.",
                filtered: true,
            },
            {
                code: "F16H2001/323",
                why: "Indexing codes F16H2001/323 to /328: cycloidal and eccentric variants of F16H1/32.",
            },
            { code: "F16H2001/324", why: "As above: orbital gear with a carrier." },
            {
                code: "F16H2001/325",
                why: "As above: cycloidal tooth profiles (cycloidal discs).",
            },
            {
                code: "F16H2001/326",
                why: "As above: multiple eccentric shafts (RV type).",
            },
            {
                code: "F16H2001/327",
                why: "As above: pin and roller teeth on the internal gear.",
            },
            {
                code: "F16H2001/328",
                why: "As above: elastic or flexible orbital gears.",
            },
        ],
        filter: {
            title: [
                "cycloid",
                "trochoid",
                "\\bRV\\b",
                "eccentric",
                "oscillat",
                "reduc",
                "gear device",
                "gear ?box",
                "gear transmission",
                "speed changer",
                "robot",
                "joint",
                "actuator",
            ],
        },
    },
    {
        id: "planetary",
        label: "Planetary gearing for robots",
        short: "Planetary (robots)",
        scope: "Planetary and multi-stage planetary gear trains filed for robots, exoskeletons or actuators; car and wind gearboxes fall out on the filter.",
        codes: [
            {
                code: "F16H1/28",
                why: "Planetary gearing with orbital gears whose axes are outside the central axis. Keyword or B25J filter applies.",
                filtered: true,
            },
            {
                code: "F16H1/46",
                why: "Multi-stage planetary trains. Keyword or B25J filter applies.",
                filtered: true,
            },
            {
                code: "F16H2001/2872",
                why: "Indexing codes for planetary gearing variants (F16H2001/2872 to /289). Filter applies.",
                filtered: true,
            },
            {
                code: "F16H2001/2881",
                why: "As above: planet carrier details.",
                filtered: true,
            },
            {
                code: "F16H2001/289",
                why: "As above: compound planetary layouts.",
                filtered: true,
            },
        ],
        filter: { title: ROBOT_TITLE, coCodes: ROBOT_CO },
    },
    {
        id: "screws",
        label: "Roller and ball screws for robots",
        short: "Roller & ball screws",
        scope: "Planetary roller screws, ball screws and screw-driven linear actuators filed for robots or as actuators.",
        codes: [
            {
                code: "F16H25/2252",
                why: "Screw mechanisms with planetary rollers between nut and screw: planetary roller screws, counted without the filter.",
            },
            {
                code: "F16H25/2266",
                why: "Roller screws with rollers parallel to the screw (recirculating rollers), counted without the filter.",
            },
            {
                code: "F16H25/22",
                why: "Screw mechanisms with balls or rollers (ball screws). Keyword or B25J filter applies.",
                filtered: true,
            },
            {
                code: "F16H25/20",
                why: "Screw mechanisms and screw linear actuators, e.g. F16H25/2015 with an integrated motor. Filter applies.",
                filtered: true,
            },
            {
                code: "F16H25/24",
                why: "Elements of screw mechanisms (nuts, return tubes, screw shafts). Filter applies.",
                filtered: true,
            },
        ],
        filter: { title: ROBOT_TITLE, coCodes: ROBOT_CO },
    },
    {
        id: "ndfeb",
        label: "NdFeB magnets",
        short: "NdFeB magnets",
        scope: "Rare-earth iron boron magnets: composition, powder and sintering, grain boundary diffusion and Dy or Tb reduction.",
        codes: [
            {
                code: "H01F1/057",
                why: "Hard magnets of rare earth, transition metal and boron (R-Fe-B, Nd2Fe14B) and their powder, sintered and bonded forms.",
            },
            {
                code: "H01F41/0293",
                why: "Diffusion of rare earth elements (Dy, Tb, Ho) into permanent magnets: grain boundary diffusion.",
            },
            {
                code: "H01F41/0253",
                why: "Manufacturing permanent magnets (moulding, pressing, anisotropy). Only rare-earth titles or R-Fe-B co-codes count here.",
                filtered: true,
            },
        ],
        filter: {
            title: [
                "rare[- ]?earth",
                "\\bR-T-B",
                "\\bRTB\\b",
                "\\bR-Fe-B",
                "NdFeB",
                "Nd-Fe-B",
                "neodym",
                "dysprosium",
                "terbium",
                "\\bNd\\b",
                "\\bDy\\b",
                "\\bTb\\b",
            ],
            coCodes: ["H01F1/057"],
        },
        exclude: [
            "iron nitride",
            "nitrided iron",
            "Fe16N2",
            "rare[- ]?earth[- ]free",
            "\\bferrite",
        ],
    },
    {
        id: "re-free-magnets",
        label: "Rare-earth-free permanent magnets",
        short: "RE-free magnets",
        scope: "Permanent magnets without rare earths: ferrites, MnBi, MnAl, iron nitride, tetrataenite and alnico.",
        codes: [
            {
                code: "H01F1/11",
                why: "Hard ferrite magnets (hexagonal barium and strontium ferrites), as a family's own code.",
            },
            {
                code: "H01F1/10",
                why: "Hard magnets of non-metallic substances, e.g. ferrites. Title filter applies: the group also holds soft ferrites.",
                filtered: true,
            },
            {
                code: "H01F41/0253",
                why: "Manufacturing permanent magnets. Only titles naming a rare-earth-free material count here.",
                filtered: true,
            },
            {
                code: "H01F1/047",
                why: "Hard magnetic alloys characterised by composition (MnBi, MnAl, FeNi). Title filter applies.",
                filtered: true,
            },
        ],
        filter: {
            title: [
                "rare[- ]?earth[- ]free",
                "free of rare",
                "without rare",
                "ferrite",
                "\\bMn-?Bi",
                "\\bMn-?Al\\b",
                "manganese",
                "iron nitride",
                "Fe16N2",
                "tetrataenite",
                "\\bL1[ _]?0\\b",
                "alnico",
                "\\bFe-?Ni\\b",
            ],
        },
    },
    {
        id: "re-free-motors",
        label: "Reluctance and axial-flux motors",
        short: "Reluctance & axial flux",
        scope: "Motor topologies that use less rare-earth magnet or none: switched and synchronous reluctance, wound-field synchronous, and axial-flux machines.",
        codes: [
            {
                code: "H02K1/24",
                why: "Rotor cores with salient poles, with H02K1/246 variable-reluctance rotors (synchronous reluctance).",
                filtered: true,
            },
            {
                code: "H02K19/02",
                why: "Synchronous motors (H02K19/02 to /14 are motors; /16 onward are generators and stay out).",
            },
            {
                code: "H02K19/06",
                why: "Synchronous motors with a variable-reluctance soft-iron rotor without windings (single phase).",
            },
            {
                code: "H02K19/10",
                why: "Multi-phase synchronous motors, with H02K19/103 switched reluctance motors.",
            },
            {
                code: "H02K19/12",
                why: "Multi-phase synchronous motors with exciting windings (wound field).",
            },
            {
                code: "H02K19/14",
                why: "Synchronous motors with exciting windings on the stator side.",
            },
            {
                code: "H02K21/24",
                why: "Machines with magnets axially facing the armature: axial-flux machines, which reach a given torque with less magnet. Also tagged on magnet tooling, so the machine-word filter applies.",
                filtered: true,
            },
        ],
        filter: {
            title: [
                "motor",
                "machine",
                "reluctan",
                "rotor",
                "stator",
                "axial",
                "\\bflux",
                "generator",
                "\\bdrive",
                "actuator",
            ],
        },
    },
    {
        id: "artificial-muscles",
        label: "Artificial muscles",
        short: "Artificial muscles",
        scope: "Soft actuators: HASEL and other electrohydraulic or electrostatic actuators, dielectric elastomers, twisted coiled polymers and shape memory alloys.",
        codes: [
            {
                code: "F03G7/065",
                why: "Shape memory alloy actuators (the code before the 2023 revision), counted without the filter.",
            },
            {
                code: "F03G7/0614",
                why: "Shape memory alloy actuators since the 2023 revision, with F03G7/06143 wires.",
            },
            {
                code: "F03G7/0612",
                why: "Actuators of fibres or yarns, e.g. twisted coiled polymer (TCP) muscles.",
            },
            {
                code: "F03G7/06",
                why: "Other actuators driven by expansion or contraction on heating or cooling. Also holds heat engines, so the filter applies.",
                filtered: true,
            },
            {
                code: "F03G7/005",
                why: "Electro-chemical, gas-absorbing and osmotic actuators. Also holds osmotic power, so the filter applies.",
                filtered: true,
            },
            {
                code: "F03G7/01",
                why: "Electroactive polymer and electro-chemical actuators (F03G7/012, /0121 and /015 since the 2023 revision). Filter applies.",
                filtered: true,
            },
            {
                code: "H02N1/00",
                why: "Electrostatic motors and actuators (H02N1/00 to /008), where HASEL and other electrostatic soft actuators sit; H02N1/04 triboelectric generators stay out. Keyword filter applies.",
                filtered: true,
            },
            {
                code: "H10N30/857",
                why: "Macromolecular electroactive materials (dielectric elastomer, PVDF). Keyword filter applies: most filings are sensors.",
                filtered: true,
            },
        ],
        filter: {
            title: [
                "muscle",
                "actuat",
                "elastomer",
                "HASEL",
                "electrohydraulic",
                "artificial",
                "soft robot",
                "electrostatic motor",
                "shape memory",
            ],
        },
    },
    {
        id: "eha",
        label: "Electrohydrostatic actuators",
        short: "Electrohydrostatic",
        scope: "Self-contained actuators where an electric motor drives a pump that moves the cylinder directly (pump-controlled hydraulics).",
        codes: [
            {
                code: "F15B15/18",
                why: "Fluid-pressure actuators combined with their own motor and pump in one unit. Keyword filter applies (gates, ploughs and footwear also file here).",
                filtered: true,
            },
            {
                code: "F15B7/00",
                why: "Actuator systems whose motion follows the output of a volumetric pump (pump-controlled cylinders, F15B7/006 rotary pump input). Keyword filter applies.",
                filtered: true,
            },
        ],
        filter: {
            title: [
                "actuat",
                "cylinder",
                "electro-?hydr",
                "hydrostatic",
                "servo",
                "robot",
                "joint",
                "linear drive",
                "drive unit",
                "hydraulic drive",
            ],
        },
    },
] as const satisfies readonly Technology[];

export type TechnologyId = (typeof TECHNOLOGIES)[number]["id"];

export const TECHNOLOGY_IDS = TECHNOLOGIES.map((t) => t.id) as TechnologyId[];

// Codes deliberately shared or nested across technologies, each with the
// reason. Any other overlap fails tests/patents/technologies.test.ts.
export const SHARED_CODES: Record<string, string> = {
    "B25J9/1025":
        "Harmonic drives in a manipulator are both a robot-joint and a strain-wave filing; robot joints reach it through B25J9/102.",
    "H01F41/0253":
        "Permanent magnet manufacturing serves both magnet sets; their title filters split rare-earth from rare-earth-free.",
};

export function getTechnology(id: string): Technology | undefined {
    return TECHNOLOGIES.find((t) => t.id === id);
}

export function isTechnologyId(id: string): id is TechnologyId {
    return TECHNOLOGIES.some((t) => t.id === id);
}

interface Compiled {
    id: TechnologyId;
    rules: readonly CpcRule[];
    title: RegExp | null;
    coCodes: readonly string[];
    exclude: RegExp | null;
}

let compiled: Compiled[] | null = null;

function compile(): Compiled[] {
    compiled ??= TECHNOLOGIES.map((t: Technology) => ({
        id: t.id as TechnologyId,
        rules: t.codes,
        title: t.filter ? new RegExp(t.filter.title.join("|"), "i") : null,
        coCodes: t.filter?.coCodes ?? [],
        exclude: t.exclude ? new RegExp(t.exclude.join("|"), "i") : null,
    }));
    return compiled;
}

// Technologies one family belongs to, from the union of its publications'
// CPC codes and its English titles. Rules are prefixes: "H02N1/00" takes
// H02N1/002 to /008 (electrostatic actuators) but not H02N1/04
// (triboelectric generators).
export function classifyFamily(
    cpc: readonly string[],
    titles: readonly string[],
): TechnologyId[] {
    return compile()
        .filter((t) => {
            if (t.exclude && titles.some((s) => t.exclude?.test(s))) return false;
            const filterPasses = () =>
                titles.some((s) => t.title?.test(s) ?? false) ||
                t.coCodes.some((p) => cpc.some((c) => c.startsWith(p)));
            return t.rules.some(
                (r) =>
                    cpc.some((c) => c.startsWith(r.code)) &&
                    (!r.filtered || filterPasses()),
            );
        })
        .map((t) => t.id);
}
