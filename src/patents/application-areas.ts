// Application areas on /patents: where a technology ends up, read from CPC
// co-classification. A family is in an area when any CPC code on any of its
// publications matches the area's pattern (a regular expression anchored at
// the start of the code). A family can be in several areas or none. This is
// a proxy for use until citation data is added: an examiner adding B60 to a
// gear patent says the gear is claimed in a vehicle, not that it ships in one.
// Relative imports only: the browser bundle reuses this module.

export interface ApplicationArea {
    id: string;
    label: string;
    // Regular expression source matched against each CPC code.
    cpc: string;
    // Why these codes stand for the area, in a line.
    why: string;
}

export const APPLICATION_AREAS = [
    {
        id: "vehicles",
        label: "Vehicles & EVs",
        cpc: "^(B60|B62D(?!57)|B62J|B62K|B62M)",
        why: "Vehicle propulsion, braking and steering, cycles and motorcycles (legged vehicles, B62D57, go to robots): where motors, screws and EHAs meet cars and e-bikes.",
    },
    {
        id: "medical",
        label: "Medical & exoskeletons",
        cpc: "^A61",
        why: "Medical devices, prostheses and rehabilitation exoskeletons (A61F, A61H), plus surgical robots (A61B34).",
    },
    {
        id: "cameras-phones",
        label: "Cameras & phones",
        cpc: "^(G03B|G02B7|G02B27/64|H04N|H04M|G06F1/16)",
        why: "Lens drives, image stabilisation and handset or laptop mechanics: the voice-coil and shape-memory market.",
    },
    {
        id: "aerospace",
        label: "Aerospace & drones",
        cpc: "^B64",
        why: "Aircraft, spacecraft and UAVs, including flight-control actuation.",
    },
    {
        id: "industrial",
        label: "Industrial machinery",
        cpc: "^(B23|B21|B24|B29|B65G|B66|G05B19)",
        why: "Machine tools, metal forming, conveying and lifting, and numerical control: the factory-automation buyer.",
    },
    {
        id: "power",
        label: "Wind & power generation",
        cpc: "^(F03D|H02J|H02K7/18)",
        why: "Wind turbines, power networks and generators coupled to a prime mover.",
    },
    {
        id: "appliances",
        label: "Home appliances",
        cpc: "^(A47|D06F|F24|F25|E05)",
        why: "Furniture and kitchen gear, washing machines, HVAC, refrigeration, and door and window drives.",
    },
    {
        id: "robots",
        label: "Robots (as product)",
        cpc: "^(B25J5|B25J11|B25J19/00|B62D57)",
        why: "Mobile, service and legged robots as finished machines, not the joint or arm mechanics inside them.",
    },
    {
        id: "semiconductors",
        label: "Semiconductors & optics",
        cpc: "^(H01L21|G03F|G02B26)",
        why: "Wafer handling and processing, lithography, and optical beam steering such as MEMS mirrors.",
    },
] as const satisfies readonly ApplicationArea[];

export type ApplicationAreaId = (typeof APPLICATION_AREAS)[number]["id"];

export const APPLICATION_AREA_IDS = APPLICATION_AREAS.map(
    (a) => a.id,
) as ApplicationAreaId[];

const COMPILED = APPLICATION_AREAS.map((a) => [a.id, new RegExp(a.cpc)] as const);

// Areas a family's CPC codes fall in, in APPLICATION_AREAS order.
export function classifyAreas(cpc: readonly string[]): ApplicationAreaId[] {
    return COMPILED.filter(([, re]) => cpc.some((c) => re.test(c))).map(([id]) => id);
}

export const getApplicationArea = (id: string) =>
    APPLICATION_AREAS.find((a) => a.id === id);
