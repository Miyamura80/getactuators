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
        if (e[0] !== "#") return ENTITIES[e.toLowerCase()] ?? m;
        const code =
            e[1]?.toLowerCase() === "x"
                ? Number.parseInt(e.slice(2), 16)
                : Number(e.slice(1));
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    });
}

// Text content of every element matching a selector, in document order.
export function texts(html: string, selector: string): string[] {
    const out: string[] = [];
    let buf = "";
    new HTMLRewriter()
        .on(selector, {
            element(el) {
                buf = "";
                el.onEndTag(() => {
                    out.push(decodeEntities(buf));
                });
            },
            text(t) {
                buf += t.text;
            },
        })
        .transform(html);
    return out;
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
    return texts(html, 'script[type="application/ld+json"]').flatMap((raw) => {
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
