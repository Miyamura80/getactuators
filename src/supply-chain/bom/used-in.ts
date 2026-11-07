import { ROBOTS, getActuator, getRobot } from "../../catalog";
import { HUMANOIDS, HUMANOIDS_PATH } from "../../humanoids";
import type { BomCase, BomUseRelation, BomUseSpec } from "./types";

// The robots and catalog actuators a /bom case links to, resolved from the
// /humanoids fleet (joint design), robots.json (joint motor ids) and
// actuators.json (the actuator itself). Photos are the catalog's own
// in-repo images; a robot without one gets `image: null` and the page draws
// a placeholder, never a hotlinked photo.

export interface BomUse {
    key: string;
    name: string;
    brand: string;
    kind: "robot" | "actuator";
    relation: BomUseRelation;
    // Actuators of this design in the robot; null when not counted.
    count: number | null;
    // In-repo image path, or null when the repo has no photo.
    image: string | null;
    // The catalog page for it, or null when there is none.
    href: string | null;
    // One line: how the link is known.
    how: string;
}

const robotHref = (id: string) => `/robots#${id}`;

function actuatorUses(spec: BomUseSpec): BomUse[] {
    return (spec.actuators ?? []).flatMap((a) => {
        const x = getActuator(a.id);
        if (!x) return [];
        return [
            {
                key: `actuator-${x.id}`,
                name: x.name,
                brand: x.brand,
                kind: "actuator" as const,
                relation: a.relation,
                count: null,
                image: x.image_url ?? null,
                href: `/actuators/${x.id}`,
                how:
                    a.relation === "this"
                        ? "This actuator in the catalog."
                        : "A catalog actuator of the same design.",
            },
        ];
    });
}

function humanoidUses(spec: BomUseSpec): (BomUse & { robotId?: string })[] {
    const h = spec.humanoids;
    if (!h) return [];
    return HUMANOIDS.flatMap((r) => {
        const count = r.joints
            .filter((j) => j.actuatorType === h.actuatorType)
            .reduce((s, j) => s + j.count, 0);
        if (count === 0) return [];
        const robot = r.robotId ? getRobot(r.robotId) : undefined;
        const own = h.thisIds?.includes(r.id) ?? false;
        return [
            {
                key: `humanoid-${r.id}`,
                name: r.name,
                brand: r.brand,
                kind: "robot" as const,
                relation: own ? ("this" as const) : ("same-design" as const),
                count,
                image: robot?.image_url ?? null,
                href: `${HUMANOIDS_PATH}?robot=${r.id}`,
                how: `${count} joints of ${own ? "this" : "the same"} design on /humanoids.`,
                robotId: robot?.id,
            },
        ];
    });
}

function catalogRobotUses(spec: BomUseSpec, skip: Set<string>): BomUse[] {
    const motors = new Set(spec.robotMotorIds ?? []);
    if (motors.size === 0) return [];
    return ROBOTS.flatMap((r) => {
        const count = r.joints
            .filter((j) => j.motor !== null && motors.has(j.motor))
            .reduce((s, j) => s + j.count, 0);
        if (count === 0 || skip.has(r.id)) return [];
        return [
            {
                key: `robot-${r.id}`,
                name: r.name,
                brand: r.brand,
                kind: "robot" as const,
                relation: "this" as const,
                count,
                image: r.image_url ?? null,
                href: robotHref(r.id),
                how: `${count} joints use this actuator in the robots catalog.`,
            },
        ];
    });
}

function otherUses(spec: BomUseSpec): BomUse[] {
    return (spec.other ?? []).map((o) => ({
        key: `other-${o.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: o.name,
        brand: o.brand,
        kind: "robot",
        relation: o.relation,
        count: o.count ?? null,
        image: null,
        href: null,
        how: o.how,
    }));
}

// The actuator itself first, then robots using it, then the same design.
const rank = (u: BomUse) =>
    (u.relation === "this" ? 0 : 2) + (u.kind === "actuator" ? 0 : 1);

export function usesOf(c: BomCase): BomUse[] {
    const humanoids = humanoidUses(c.uses);
    const seen = new Set(humanoids.flatMap((u) => (u.robotId ? [u.robotId] : [])));
    const all: BomUse[] = [
        ...actuatorUses(c.uses),
        ...humanoids.map(({ robotId: _, ...u }) => u),
        ...catalogRobotUses(c.uses, seen),
        ...otherUses(c.uses),
    ];
    return all
        .map((u, i) => ({ u, i }))
        .sort((a, b) => rank(a.u) - rank(b.u) || a.i - b.i)
        .map(({ u }) => u);
}

// The one image that stands for a case: the actuator's own catalog photo,
// else a photo of a robot that uses this very actuator, else the case's
// own 3D explode render (the poster the page shows before WebGL loads).
export interface BomHero {
    kind: "photo" | "render";
    src: string;
    alt: string;
    // Catalog page of what the photo shows, when there is one.
    href: string | null;
    caption: string;
}

export function heroOf(c: BomCase, uses: readonly BomUse[] = usesOf(c)): BomHero {
    const own =
        uses.find((u) => u.relation === "this" && u.kind === "actuator" && u.image) ??
        uses.find((u) => u.relation === "this" && u.image);
    if (own?.image)
        return {
            kind: "photo",
            src: own.image,
            alt: `${own.brand} ${own.name}`,
            href: own.href,
            caption: `${own.brand} ${own.name}`,
        };
    return {
        kind: "render",
        src: `/posters/bom-${c.slug}.png`,
        alt: `${c.name}, exploded 3D model`,
        href: null,
        caption: "Our 3D model, exploded",
    };
}
