// Small HTML readers on Bun's HTMLRewriter (a streaming CSS-selector parser),
// so the extractors need no DOM library.

const ENTITIES: Record<string, string> = {
    amp: "&",
    nbsp: " ",
    pound: "£",
    euro: "€",
    yen: "¥",
    dollar: "$",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
};

// HTMLRewriter hands text over with entities still encoded.
export function decodeEntities(s: string): string {
    return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
        if (e[0] !== "#") {
            const name = e.toLowerCase();
            return Object.hasOwn(ENTITIES, name) ? (ENTITIES[name] as string) : m;
        }
        const code =
            e[1]?.toLowerCase() === "x"
                ? Number.parseInt(e.slice(2), 16)
                : Number(e.slice(1));
        return Number.isInteger(code) && code >= 0 && code <= 0x10ffff
            ? String.fromCodePoint(code)
            : m;
    });
}

// Text content of every element matching a selector, in start-tag order.
// A nested match keeps its own text and adds it to every open ancestor.
// raw skips entity decoding (script content is not entity-encoded).
export function texts(html: string, selector: string, raw = false): string[] {
    const out: string[] = [];
    const open: number[] = [];
    new HTMLRewriter()
        .on(selector, {
            element(el) {
                out.push("");
                if (el.selfClosing || !el.canHaveContent) return;
                open.push(out.length - 1);
                el.onEndTag(() => {
                    open.pop();
                });
            },
            text(t) {
                for (const i of open) out[i] += t.text;
            },
        })
        .transform(html);
    return raw ? out : out.map(decodeEntities);
}

// One attribute of every element matching a selector.
export function attrs(html: string, selector: string, name: string): string[] {
    const out: string[] = [];
    new HTMLRewriter()
        .on(selector, {
            element(el) {
                const v = el.getAttribute(name);
                if (v !== null) out.push(v);
            },
        })
        .transform(html);
    return out;
}

// Parsed <script type="application/ld+json"> blocks; malformed ones skipped.
export function jsonLdBlocks(html: string): unknown[] {
    return texts(html, 'script[type="application/ld+json"]', true).flatMap((raw) => {
        try {
            return [JSON.parse(raw.trim())];
        } catch {
            return [];
        }
    });
}

export function metaContent(html: string, key: string): string | null {
    for (const sel of [
        `meta[property="${key}"]`,
        `meta[name="${key}"]`,
        `meta[itemprop="${key}"]`,
    ]) {
        const v = attrs(html, sel, "content")[0];
        if (v) return v;
    }
    return null;
}
