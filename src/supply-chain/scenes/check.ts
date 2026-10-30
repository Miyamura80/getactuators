import { type ExplodeSceneSpec, PART_KINDS, type ProcessLoopSpec } from "./spec";

const KINDS = new Set<string>(PART_KINDS);

function numbersIn(x: unknown, path: string, out: string[]): void {
    if (typeof x === "number") {
        if (!Number.isFinite(x)) out.push(`${path} is not finite`);
        return;
    }
    if (Array.isArray(x)) {
        x.forEach((v, i) => numbersIn(v, `${path}[${i}]`, out));
        return;
    }
    if (x && typeof x === "object") {
        for (const [k, v] of Object.entries(x)) numbersIn(v, `${path}.${k}`, out);
    }
}

function idProblems(scope: string, ids: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const id of ids) {
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id))
            out.push(`${scope}: id "${id}" is not kebab-case`);
        if (seen.has(id)) out.push(`${scope}: duplicate id "${id}"`);
        seen.add(id);
    }
    return out;
}

// Problems with a scene that would render wrongly or not at all: unknown part
// kinds, duplicate or malformed ids, NaN geometry, more than one accent.
export function sceneProblems(scene: ExplodeSceneSpec): string[] {
    const out = idProblems(
        scene.id,
        scene.parts.map((p) => p.id),
    );
    for (const p of scene.parts) {
        if (!KINDS.has(p.component))
            out.push(`${scene.id}/${p.id}: unknown part "${p.component}"`);
        numbersIn(p, `${scene.id}/${p.id}`, out);
    }
    if (scene.parts.filter((p) => p.accent).length > 1) {
        out.push(`${scene.id}: more than one accent part`);
    }
    return out;
}

export function loopProblems(loop: ProcessLoopSpec): string[] {
    const out = idProblems(loop.id, [
        ...loop.actors.map((a) => a.id),
        ...(loop.fields ?? []).map((f) => f.id),
        ...(loop.particles ?? []).map((p) => p.id),
    ]);
    if (!(loop.duration > 0)) out.push(`${loop.id}: duration must be positive`);
    for (const a of loop.actors) {
        if (!KINDS.has(a.component))
            out.push(`${loop.id}/${a.id}: unknown part "${a.component}"`);
    }
    const tracks = [...loop.actors, ...(loop.fields ?? []), ...(loop.particles ?? [])];
    for (const t of tracks) {
        for (const k of t.track) {
            if (k.at < 0 || k.at > 1)
                out.push(`${loop.id}/${t.id}: keyframe at ${k.at} outside 0..1`);
        }
    }
    numbersIn(loop, loop.id, out);
    return out;
}
