import { canonicalBrand, colorForBrand } from "@/catalog/brands";
import {
    type ShortlistActuator,
    type ShortlistRow,
    TORQUE_FIT_LABEL,
    integrationNote,
} from "@/catalog/shortlist";
import { esc } from "./head";

// Server-rendered shortlist rows for pages whose text stays outside React
// (the humanoid guide's joint sections). Same markup and classes as the
// React RequirementShortlist, so one stylesheet draws both: the part's
// photo, a brand badge, spec glyphs and a fit gauge against the requirement.

interface PartActuator extends ShortlistActuator {
    image_url?: string | null;
}

function num(v: number): string {
    return Number(v.toPrecision(3)).toLocaleString("en-US");
}

function value(v: number | null, unit: string): string {
    return v == null ? "n/d" : `${num(v)} ${unit}`;
}

function badge(brand: string): string {
    const name = canonicalBrand(brand);
    const initials = name
        .split(/[\s/-]+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    const two = initials.length > 1;
    return `<span class="brand-badge" title="${esc(brand)}"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="0.5" y="0.5" width="15" height="15" rx="3" fill="${colorForBrand(brand)}"/><text x="8" y="${two ? 10.8 : 11.6}" text-anchor="middle" fill="#000" font-weight="700" font-family="JetBrains Mono, ui-monospace, monospace" font-size="${two ? 7.5 : 10}">${esc(initials)}</text></svg><span>${esc(name)}</span></span>`;
}

const SPEC: Record<string, [string, string]> = {
    rated: ["Rated torque", '<rect x="1" y="3" width="14" height="6"/>'],
    peak: ["Peak torque", '<path d="M1 3h14v6H1ZM3 9l4-6M7 9l4-6M11 9l4-6"/>'],
    speed: ["Max speed", '<path d="M2 10a6 6 0 0 1 12 0M8 10l3-4"/>'],
    mass: ["Mass", '<path d="M5 4a3 2 0 0 1 6 0M3 5h10l1.5 6h-13Z"/>'],
};

function spec(kind: keyof typeof SPEC, text: string): string {
    const [label, shape] = SPEC[kind] ?? ["", ""];
    return `<div><dt><span class="spec-glyph spec-${kind}" title="${label}"><svg viewBox="0 0 16 12" width="16" height="12" aria-hidden="true">${shape}</svg><span class="sr-only">${label}</span></span></dt><dd>${esc(text)}</dd></div>`;
}

// Solid bar = rated, hatch = peak, tick = the joint's estimate.
function gauge(need: number, a: ShortlistActuator, id: string): string {
    const W = 168;
    const Y = 11;
    const top = Math.max(need, a.rated_torque_nm ?? 0, a.peak_torque_nm ?? 0) * 1.1;
    const x = (v: number) => 2 + (v / top) * (W - 4);
    const xr = a.rated_torque_nm != null ? x(a.rated_torque_nm) : 2;
    const xp = a.peak_torque_nm != null ? x(a.peak_torque_nm) : xr;
    const xn = x(need);
    const covered = a.rated_torque_nm != null && a.rated_torque_nm >= need;
    const label = covered
        ? `Rated ${num(a.rated_torque_nm ?? 0)} N·m covers ${num(need)} N·m`
        : `Only peak ${num(a.peak_torque_nm ?? 0)} N·m reaches ${num(need)} N·m: short duty`;
    const hatch = `fit-hatch-${id}`;
    return [
        `<svg class="fit-gauge ${covered ? "rated" : "peak"}" viewBox="0 0 ${W} 20" width="${W}" height="20" role="img" aria-label="${label}"><title>${label}</title>`,
        `<defs><pattern id="${hatch}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4"/></pattern></defs>`,
        `<line class="fit-axis" x1="2" y1="${Y}" x2="${W - 2}" y2="${Y}"/>`,
        xp > xr
            ? `<rect class="fit-peak" fill="url(#${hatch})" x="${xr}" y="${Y - 4}" width="${xp - xr}" height="8"/>`
            : "",
        a.rated_torque_nm != null
            ? `<rect class="fit-rated" x="2" y="${Y - 4}" width="${xr - 2}" height="8"/>`
            : "",
        `<path class="fit-need" d="M${xn} ${Y - 7}V${Y + 7}M${xn - 3.5} 1L${xn} ${Y - 7}L${xn + 3.5} 1Z"/>`,
        "</svg>",
    ].join("");
}

// The part, or the site's end-on actuator mark when there is no photo.
function thumb(a: PartActuator): string {
    return a.image_url
        ? `<img class="actuator-photo" src="${esc(a.image_url)}" alt="" loading="lazy" decoding="async">`
        : '<svg class="thumb-svg" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="#c3fffd" stroke-width="2"/><circle cx="50" cy="50" r="18" fill="none" stroke="#c3fffd" stroke-width="2"/><rect x="45" y="45" width="10" height="10" fill="#c3fffd"/></svg>';
}

const DRIVER =
    '<svg class="fit-glyph warn" viewBox="0 0 20 20" width="20" height="20" role="img" aria-label="Drive electronics not included"><title>Drive electronics not included</title><path d="M7 3v4M13 3v4M5 7h10v3a5 5 0 0 1-10 0zM10 15v3M3 17L17 3"/></svg>';

export function partRowsHtml(
    rows: ShortlistRow<PartActuator>[],
    need: number,
    key: string,
): string {
    const items = rows.map(({ actuator: a, torque }, i) => {
        const href = `/actuators/${encodeURIComponent(a.id)}`;
        const note = integrationNote(a);
        return [
            `<li class="req-row fit-${torque}">`,
            `<a href="${href}" class="req-thumb" tabindex="-1" aria-hidden="true">${thumb(a)}</a>`,
            `<a href="${href}" class="req-name">${badge(a.brand)}${esc(a.name)}</a>`,
            '<dl class="req-specs">',
            spec("rated", value(a.rated_torque_nm, "N·m")),
            spec("peak", value(a.peak_torque_nm, "N·m")),
            spec("speed", value(a.max_speed_rpm, "rpm")),
            spec("mass", value(a.weight_g, "g")),
            "</dl>",
            `<p class="req-tags">${gauge(need, a, `${key}-${i}`)}${note ? DRIVER : ""}<span class="sr-only">${esc(TORQUE_FIT_LABEL[torque])}${note ? `. ${esc(note)}` : ""}</span></p>`,
            "</li>",
        ].join("");
    });
    return `<ol class="req-rows">${items.join("")}</ol>`;
}
