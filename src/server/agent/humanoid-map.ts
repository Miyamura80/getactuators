import { JOINTS, type Joint, jointShortlist } from "./humanoid-joints";

// The joint map: a humanoid drawn like an assembly drawing, each actuated
// joint called out with a numbered balloon. Balloons and the bill-of-joints
// table link to the joint's section; CSS :target lights the matching balloon.
// Pure SVG and anchors: works without JavaScript and in every crawler.

type Pt = [number, number];

// Figure coordinates (viewBox 0 0 320 520), robot facing the viewer.
const P = {
    head: [160, 46] as Pt,
    shoulderL: [114, 104] as Pt,
    shoulderR: [206, 104] as Pt,
    elbowL: [98, 186] as Pt,
    elbowR: [222, 186] as Pt,
    wristL: [90, 262] as Pt,
    wristR: [230, 262] as Pt,
    waist: [160, 216] as Pt,
    hipL: [142, 248] as Pt,
    hipR: [178, 248] as Pt,
    kneeL: [139, 350] as Pt,
    kneeR: [181, 350] as Pt,
    ankleL: [137, 452] as Pt,
    ankleR: [183, 452] as Pt,
};

// Which figure joint each balloon points at, and which side it sits on. Arms
// are called out on the left, trunk and legs on the right, so leaders never cross.
const CALLOUT: Record<string, { at: Pt; side: "l" | "r" }> = {
    shoulder: { at: P.shoulderL, side: "l" },
    elbow: { at: P.elbowL, side: "l" },
    wrist: { at: P.wristL, side: "l" },
    waist: { at: P.waist, side: "r" },
    hip: { at: P.hipR, side: "r" },
    knee: { at: P.kneeR, side: "r" },
    ankle: { at: P.ankleR, side: "r" },
};

const link = (a: Pt, b: Pt) =>
    `<line class="jm-link" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
const pin = (p: Pt, id: string) =>
    `<circle class="jm-joint jm-${id}" cx="${p[0]}" cy="${p[1]}" r="7"/>`;

function figure(): string {
    const limbs = [
        [P.shoulderL, P.elbowL],
        [P.elbowL, P.wristL],
        [P.shoulderR, P.elbowR],
        [P.elbowR, P.wristR],
        [P.hipL, P.kneeL],
        [P.kneeL, P.ankleL],
        [P.hipR, P.kneeR],
        [P.kneeR, P.ankleR],
    ] as const;
    const body = [
        `<circle class="jm-shell" cx="${P.head[0]}" cy="${P.head[1]}" r="24"/>`,
        `<path class="jm-shell" d="M150 72h20v18h-20zM120 92h80l-8 112h-64z"/>`,
        `<path class="jm-shell" d="M132 224h56l-6 34h-44z"/>`,
        `<path class="jm-shell" d="M84 274l12 20M96 274l0 22M222 274l12 20M234 274v22"/>`,
        `<path class="jm-shell" d="M118 462h34v12h-34zM168 462h34v12h-34z"/>`,
        ...limbs.map(([a, b]) => link(a, b)),
    ].join("");
    // Every actuated joint on both sides gets a pin; the called-out side links.
    const pins = [
        ["shoulder", P.shoulderR],
        ["elbow", P.elbowR],
        ["wrist", P.wristR],
        ["hip", P.hipL],
        ["knee", P.kneeL],
        ["ankle", P.ankleL],
    ]
        .map(([id, p]) => pin(p as Pt, id as string))
        .join("");
    return body + pins;
}

function balloon(j: Joint, base: string): string {
    const c = CALLOUT[j.id];
    if (!c) return "";
    const [x, y] = c.at;
    const bx = c.side === "l" ? 30 : 290;
    const by = y;
    const elbowX = c.side === "l" ? bx + 14 : bx - 14;
    return `<a class="jm-callout jm-${j.id}" href="${base}#${j.id}" aria-label="${j.n}. ${j.name}: ${j.torqueNm} N·m static estimate"><path class="jm-leader" d="M${elbowX} ${by}L${x} ${y}"/><circle class="jm-dot" cx="${x}" cy="${y}" r="2.5"/>${pin(c.at, j.id)}<circle class="jm-balloon" cx="${bx}" cy="${by}" r="14"/><text x="${bx}" y="${by + 4.5}" text-anchor="middle">${j.n}</text></a>`;
}

function bomRow(j: Joint, base: string): string {
    const list = jointShortlist(j, Number.POSITIVE_INFINITY);
    const rated = list.rows.filter((r) => r.torque === "rated").length;
    const screen = list.total
        ? `${list.total} pass${rated ? `, ${rated} rated` : ", peak only"}`
        : "none documented";
    return `<tr class="jm-${j.id}"><td><a href="${base}#${j.id}" class="jm-num">${j.n}</a></td><th scope="row"><a href="${base}#${j.id}">${j.name}</a></th><td>${j.dof.split(" ")[0]}</td><td class="jm-val">${j.torqueNm.toFixed(1)}</td><td>${screen}</td></tr>`;
}

// `base` prefixes every link: "" on the guide itself, the guide's path when
// the map is shown elsewhere (the /robots page).
export function humanoidJointMap(base = ""): string {
    const svg = `<svg class="jm-figure" viewBox="0 0 320 520" role="img" aria-labelledby="jm-title"><title id="jm-title">Humanoid joint map: seven numbered actuated joints from shoulder to ankle</title>${figure()}${JOINTS.map((j) => balloon(j, base)).join("")}<text class="jm-scale" x="160" y="508" text-anchor="middle">REFERENCE: 1.5 m, 50 kg, 1 kg in hand (hypothetical)</text></svg>`;
    const table = `<table class="jm-bom"><caption>Bill of joints · static estimates</caption><thead><tr><th scope="col">#</th><th scope="col">Joint</th><th scope="col">DOF</th><th scope="col">N·m</th><th scope="col">Catalog screen</th></tr></thead><tbody>${JOINTS.map((j) => bomRow(j, base)).join("")}</tbody></table>`;
    const notes = `<p class="jm-note">Static torque is a floor: gait, stairs and impacts add dynamic load this map does not estimate. Screens count humanoid-tagged catalog entries whose documented rated or peak torque reaches the estimate.</p>`;
    return `<div class="jm">${svg}<div class="jm-side">${table}${notes}</div></div>`;
}
