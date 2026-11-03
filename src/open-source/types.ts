import type { Sourced } from "../humanoids/sourced";

// Open-source robots: what is published for each, under which licence, and
// which actuators sit in its joints. The joint shape mirrors robots.json
// (role + count + motor) so a record can be read next to /robots.

export const ROBOT_TYPES = ["mobile-manipulator", "arm", "humanoid", "legged"] as const;
export type OpenRobotType = (typeof ROBOT_TYPES)[number];

export const ROBOT_TYPE_LABEL: Record<OpenRobotType, string> = {
    "mobile-manipulator": "Mobile manipulator",
    arm: "Arm",
    humanoid: "Humanoid",
    legged: "Legged",
};

// The eight openness dimensions of the matrix. The first seven are published
// artefacts with a link; "licence" is derived from the licence list.
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
export type ArtefactDimension = Exclude<OpennessDimension, "licence">;

export const OPENNESS_LABEL: Record<OpennessDimension, string> = {
    cad: "Mechanical CAD",
    electronics: "Electronics",
    firmware: "Firmware",
    software: "Software / control",
    bom: "BOM with suppliers",
    assembly: "Assembly guide",
    sim: "Sim model",
    licence: "Licence",
};

export type OpennessStatus = "full" | "partial" | "missing";

export interface OpennessLink {
    url: string;
    status: "full" | "partial";
    // SPDX id (or LicenseRef-*) covering this artefact, when stated.
    licence?: string;
    // Why it is partial, or what exactly is published.
    note?: string;
}

// One joint group. `actuatorId` is a catalog id (frontend/src/data/actuators.json)
// when the catalog lists the actuator; otherwise it is unlisted and `name` says
// what it is.
export interface OpenRobotJoint {
    role: string;
    count: number;
    name: string;
    brand: string;
    actuatorId?: string;
    // Source ids (keys of ./sources) backing this joint group.
    sources: string[];
    note?: string;
}

export interface OpenRobot {
    id: string;
    name: string;
    type: OpenRobotType;
    maintainers: string[];
    // ISO 3166-1 alpha-2 of the lead maintainer, null when not stated.
    country: string | null;
    summary: string;
    // Matching record in frontend/src/data/robots.json, when there is one.
    robotId?: string;
    // Robot id this design is forked or derived from, for the family tree.
    derivedFrom?: string;
    // Main repository, "owner/name" on GitHub, used for the stars snapshot.
    repo?: string;
    homepage: string;
    image?: string;
    dof: number | null;
    // What the DOF figure counts, when it is derived rather than published.
    dofNote?: string;
    payloadKg?: Sourced<number>;
    // Parts cost to build one (bom) or the cheapest kit price (kit).
    bomCostUsd?: Sourced<number> & { basis: "bom" | "kit" };
    // SPDX ids; LicenseRef-* for terms with no SPDX id.
    licence: string[];
    openness: Partial<Record<ArtefactDimension, OpennessLink>>;
    joints: OpenRobotJoint[];
    // Joints the sources do not itemise, so the joint list is a floor.
    jointsNote?: string;
    // Why a record is listed although it misses the inclusion rule.
    inclusionNote?: string;
    sources: string[];
}

// A seed candidate that does not pass the inclusion rule, and why.
export interface ExcludedRobot {
    name: string;
    url: string;
    reason: string;
    sources: string[];
}

export interface RepoStat {
    stars: number | null;
    // Date of the latest commit on the default branch, YYYY-MM-DD.
    lastCommit: string | null;
}
