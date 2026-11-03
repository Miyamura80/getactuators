import type { CountryCode } from "../countries";
import type { ExplodeSceneSpec, ProcessLoopSpec } from "../scenes/spec";
import type { SourceId, Sourced } from "../sourced";

// Data model of /alts: every serious alternative to the rare-earth electric
// actuator, its readiness, the markets it sells into, where it runs today and
// how it works inside.

export const ALT_FAMILIES = [
    "ree-free-motor",
    "artificial-muscle",
    "hydraulic",
    "transmission",
] as const;
export type AltFamily = (typeof ALT_FAMILIES)[number];

export const FAMILY_LABEL: Record<AltFamily, string> = {
    "ree-free-motor": "Rare-earth-free motors",
    "artificial-muscle": "Artificial muscles",
    hydraulic: "Hydraulic and electrohydraulic",
    transmission: "Transmissions",
};

export const COMPANY_TYPES = ["startup", "incumbent", "academic"] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

export const COMPANY_TYPE_LABEL: Record<CompanyType, string> = {
    startup: "Startup",
    incumbent: "Incumbent",
    academic: "Academic",
};

export const END_MARKETS = [
    "humanoid",
    "industrial",
    "mobile",
    "medical-exo",
    "automotive",
    "other",
] as const;
export type EndMarket = (typeof END_MARKETS)[number];

export const END_MARKET_LABEL: Record<EndMarket, string> = {
    humanoid: "Humanoid",
    industrial: "Industrial machines and arms",
    mobile: "Mobile and quadruped",
    "medical-exo": "Medical and exoskeleton",
    automotive: "Automotive",
    other: "Other (appliances, aerospace)",
};

// What the actuator does for magnets: the rare-earth question in one word.
export const MAGNET_USES = [
    "none",
    "ferrite",
    "iron-nitride",
    "permanent",
    "motor",
] as const;
export type MagnetUse = (typeof MAGNET_USES)[number];

export const MAGNET_USE_LABEL: Record<MagnetUse, string> = {
    none: "No magnets",
    ferrite: "Ferrite magnets",
    "iron-nitride": "Iron nitride magnets",
    permanent: "Permanent magnets",
    motor: "Set by its pump motor",
};

export const MILESTONE_KINDS = ["lab", "first-commercial", "volume"] as const;
export type MilestoneKind = (typeof MILESTONE_KINDS)[number];

export const MILESTONE_LABEL: Record<MilestoneKind, string> = {
    lab: "Lab demo",
    "first-commercial": "First product",
    volume: "Volume",
};

// A dated step towards readiness. `year` is the earliest dated public
// evidence we cite, so the real event may be earlier; `announced` marks a
// target that has not happened yet.
export interface Milestone {
    kind: MilestoneKind;
    // At most eight words: "Kangoo Z.E. ships with a wound rotor".
    label: string;
    year: Sourced<number>;
    announced: boolean;
}

export interface Player {
    // Supply-chain registry company (src/supply-chain/companies).
    companyId: string;
    companyType: CompanyType;
}

// Cited performance figures. Units are fixed per field so the charts can
// compare them; leave a field out when no public source has it.
export interface AltMetrics {
    // Fraction 0..1.
    efficiency?: Sourced<number>;
    // Mechanical power per kilogram of actuator, W/kg.
    specificPower?: Sourced<number>;
    // Nm/kg.
    torqueDensity?: Sourced<number>;
    // USD per Nm of rated torque.
    costPerNm?: Sourced<number>;
    // kg of rare earth elements per kW of output.
    reeIntensityKgPerKw?: Sourced<number>;
}

// Any other cited number worth a line ("Force 7 kN").
export interface KeyFact {
    // One to four words.
    label: string;
    value: Sourced<number>;
}

export type AltScene =
    | { kind: "loop"; spec: ProcessLoopSpec }
    | { kind: "explode"; spec: ExplodeSceneSpec };

export interface AltTech {
    id: string;
    family: AltFamily;
    name: string;
    // Tile label, at most three words.
    short: string;
    // At most twenty words.
    principle: string;
    magnets: MagnetUse;
    // 1..9, our reading of the cited evidence (modeled) with the basis in sources.
    trl: Sourced<number>;
    milestones: Milestone[];
    players: Player[];
    metrics: AltMetrics;
    facts: KeyFact[];
    scene: AltScene;
    // Where the principle and the scene's shape come from.
    sources: SourceId[];
}

// A treemap leaf: one published market size and growth rate, covering one
// or more technologies. The grouping fields are our classification (see the
// methodology box), not the publisher's split.
export interface MarketSlice {
    id: string;
    // What the publisher sized: "Induction motors".
    label: string;
    techIds: string[];
    revenueUsd: Sourced<number>;
    // Fraction per year.
    cagr: Sourced<number>;
    endMarket: EndMarket;
}

export const DEPLOYMENT_STATUSES = ["shipping", "pilot", "demo", "retired"] as const;
export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

export interface Deployment {
    id: string;
    techId: string;
    // Who runs it; a registry company when we have one.
    org: string;
    companyId?: string;
    product: string;
    // ISO date or "YYYY" / "YYYY-MM" of the dated public source.
    date: string;
    status: DeploymentStatus;
    location?: { lat: number; lon: number; country: CountryCode; place: string };
    sources: SourceId[];
}
