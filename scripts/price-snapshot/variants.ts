// Product pages often list several variants (voltage, encoder, bundle). Pick
// the one that matches the catalog entry: the variant whose title shares the
// most tokens with the catalog name and id ("RMD-X8-120", "48V", "2EC").

export interface VariantLike {
    title: string;
}

const tokens = (s: string) =>
    new Set(
        s
            .toLowerCase()
            .replace(/[()/,+]/g, " ")
            .split(/[\s_]+/)
            .flatMap((t) => [t, t.replace(/[-.]/g, "")])
            .filter((t) => t.length >= 2),
    );

export interface VariantPick<T> {
    variant: T;
    // True when two or more variants scored the same: needs a person.
    ambiguous: boolean;
}

export function pickVariant<T extends VariantLike>(
    variants: readonly T[],
    hint: string,
): VariantPick<T> | null {
    const first = variants[0];
    if (!first) return null;
    if (variants.length === 1) return { variant: first, ambiguous: false };
    const want = tokens(hint);
    const scored = variants.map((v) => {
        const have = tokens(v.title);
        let score = 0;
        for (const t of want) if (have.has(t)) score += 1;
        return { v, score };
    });
    const best = Math.max(...scored.map((s) => s.score));
    const top = scored.filter((s) => s.score === best);
    const pick = top[0] ?? { v: first };
    return { variant: pick.v, ambiguous: top.length > 1 };
}
