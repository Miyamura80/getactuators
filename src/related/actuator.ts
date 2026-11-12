import type { CategorySlug } from "../catalog/types";
import { HUMANOIDS, HUMANOIDS_PATH } from "../humanoids";
import type { CanonicalJoint } from "../humanoids/types";
import { PATENTS_PATH } from "../patents/path";
import { type TechnologyId, getTechnology } from "../patents/technologies";

// Links from one catalog actuator to the market-intelligence pages: the
// humanoids that put it in a joint, and the patent technologies its design
// belongs to. Shared by the actuator page and its markdown twin. Relative
// imports only: the browser bundle reuses this module.

export interface RelatedLink {
    href: string;
    label: string;
    // Short context after the label, e.g. the joints it drives.
    detail?: string;
}

// Patent technologies per catalog category, most specific first. Categories
// sold as a motor (QDD, integrated joints, frameless kits) also get NdFeB,
// the magnet in nearly all of them.
export const CATEGORY_PATENTS: Record<CategorySlug, readonly TechnologyId[]> = {
    qdd_proprioceptive: ["planetary", "robot-joints", "ndfeb"],
    integrated_joint: ["robot-joints", "ndfeb"],
    smart_servo: ["robot-joints"],
    harmonic_precision: ["strain-wave", "robot-joints"],
    cycloidal_premium: ["cycloidal", "robot-joints"],
    frameless_driver: ["ndfeb", "re-free-motors"],
};

// "l-hip-pitch" -> "hip pitch"; "waist" stays "waist".
const jointName = (c: CanonicalJoint) => c.replace(/^[lr]-/, "").replace("-", " ");

export function humanoidLinks(actuatorId: string): RelatedLink[] {
    return HUMANOIDS.flatMap((h) => {
        const joints = h.joints.filter((j) => j.actuatorId === actuatorId);
        const first = joints[0];
        if (!first) return [];
        const names = [...new Set(joints.map((j) => jointName(j.canonical)))];
        const q = new URLSearchParams({ robot: h.id, joint: first.canonical });
        return [
            { href: `${HUMANOIDS_PATH}?${q}`, label: h.name, detail: names.join(", ") },
        ];
    });
}

export function patentLinks(category: CategorySlug): RelatedLink[] {
    return CATEGORY_PATENTS[category].map((id) => {
        const t = getTechnology(id);
        return { href: `${PATENTS_PATH}?technology=${id}`, label: t.short };
    });
}
