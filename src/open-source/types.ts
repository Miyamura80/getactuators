import type { Sourced } from "../supply-chain/sourced";

// The shape of one open-source robot on /open-source. Relative imports only:
// the browser bundle reuses this module.

export const OPEN_ROBOT_TYPES = [
    "mobile-manipulator",
    "arm",
    "humanoid",
    "legged",
] as const;
export type OpenRobotType = (typeof OPEN_ROBOT_TYPES)[number];

export const OPEN_ROBOT_TYPE_LABEL: Record<OpenRobotType, string> = {
    "mobile-manipulator": "Mobile manipulator",
    arm: "Arm",
    humanoid: "Humanoid",
    legged: "Legged",
};

// The eight things a builder needs to reproduce a robot. Each one is "full",
// "partial" or missing (absent from the record); the openness score is the
// share that is full, with partial counting half.
export const OPENNESS_DIMENSIONS = [
    "cad",
    "electronics",
    "firmware",
    "software",
    "bom",
    "assembly",
    "sim",
    "licence",
] as const;
export type OpennessDimension = (typeof OPENNESS_DIMENSIONS)[number];

export const OPENNESS_LABEL: Record<OpennessDimension, string> = {
    cad: "Mechanical CAD",
    electronics: "Electronics",
    firmware: "Firmware",
    software: "Software / control",
    bom: "BOM with suppliers",
    assembly: "Assembly guide",
    sim: "Sim model (URDF / MJCF)",
    licence: "Licence",
};

export type OpennessStatus = "full" | "partial";

export interface OpenLink {
    url: string;
    status: OpennessStatus;
    // What is there, or what is missing for "full".
    note?: string;
}

export interface OpenJoint {
    role: string;
    // Null when the project does not say how many of this motor it uses.
    count: number | null;
    // Catalog actuator id (frontend/src/data/actuators.json) when the motor
    // is in the catalog; otherwise the joint is "unlisted" and `motor` names it.
    actuatorId?: string;
    motor: string;
    brand: string;
    note?: string;
    sources: string[];
}

export interface OpenRobot {
    id: string;
    name: string;
    type: OpenRobotType;
    // Org ids or names of who maintains the design.
    maintainers: string[];
    // ISO 3166-1 alpha-2 of the lead maintainer, when stated.
    country?: string;
    // Primary GitHub repository ("owner/name"); null when none was found.
    repo: string | null;
    homepage?: string;
    summary: string;
    dof: number | null;
    dofNote?: string;
    weightKg?: number;
    openness: Partial<Record<OpennessDimension, OpenLink>>;
    // SPDX ids (LicenseRef-* for none); hardware and software licences both.
    licence: string[];
    // Cost to build: a parts BOM, or a kit price where no BOM total is
    // published (the note says which). Unit is "USD" or "EUR".
    bomCost?: Sourced<number>;
    // Robot ids this design forks or builds on (the family tree).
    derivedFrom?: string[];
    // The matching record in robots.json, for the /robots catalog.
    catalogRobotId?: string;
    // Self-hosted photo and its credit (repo and licence).
    image?: { url: string; credit: string };
    joints: OpenJoint[];
    // At least the mechanical design, or the full BOM plus build
    // instructions, is public under a stated licence.
    meetsInclusionRule: boolean;
    inclusionNote?: string;
    sources: string[];
}

export interface RepoStat {
    stars: number;
    // True when GitHub only showed a rounded figure (e.g. "7.9k").
    starsRounded: boolean;
    lastCommit: string;
}

export interface RepoStats {
    asOf: string;
    method: string;
    repos: Record<string, RepoStat>;
}
