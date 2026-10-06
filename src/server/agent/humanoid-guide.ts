import { readFileSync } from "node:fs";
import { TORQUE_FIT_LABEL, integrationNote } from "@/catalog/shortlist";
import { absoluteUrl } from "../site";
import { actuatorPath } from "./catalog-md";
import {
    HUMANOID_GUIDE_PATH,
    JOINTS,
    type Joint,
    jointShortlist,
    undocumentedHumanoidEntries,
} from "./humanoid-joints";
import { breadcrumbs } from "./jsonld";
import { mdLink, num } from "./md";
import type { Page } from "./page-types";

// Joint-by-joint humanoid actuator guide. The prose is Markdown; each joint's
// estimate and catalog screen are generated from the catalog so the HTML, the
// .md twin and the map never disagree with the data.

export { HUMANOID_GUIDE_PATH };

const template = readFileSync(
    new URL("./content/humanoid-robot-actuators.md", import.meta.url),
    "utf8",
).trim();

// "RobStride 01", not "RobStride RobStride 01".
function displayName(a: { brand: string; name: string }): string {
    const first = a.brand.split(" ")[0] ?? "";
    return a.name.startsWith(first) ? a.name : `${a.brand} ${a.name}`;
}

function compareLink(ids: string[]): string {
    return `/compare?compare=${[...ids].sort().join(",")}`;
}

export function jointBlock(j: Joint): string {
    const list = jointShortlist(j);
    const nm = `${j.torqueNm.toFixed(1)} N·m`;
    const head = `**Estimate: ${nm} static.** Typical DOF: ${j.dof}. Pose: ${j.pose}. Working: ${j.working} = ${nm}.`;
    if (!list.total) {
        return `${head}\n\n**Catalog screen:** no humanoid-tagged entry documents ${nm}. Screen the whole catalog in the [motor torque calculator](/tools/motor-torque-calculator).`;
    }
    const rows = list.rows.map(({ actuator: a, torque }) => {
        const specs = [
            `rated ${num(a.rated_torque_nm, "N·m")}`,
            `peak ${num(a.peak_torque_nm, "N·m")}`,
            `mass ${num(a.weight_g, "g", 0)}`,
        ].join(", ");
        const note = integrationNote(a);
        return `- ${mdLink(displayName(a), actuatorPath(a.id))}: ${specs}. ${TORQUE_FIT_LABEL[torque]}.${note ? ` ${note}.` : ""}`;
    });
    const ids = list.rows.map((r) => r.actuator.id);
    const peakOnly = list.rows.every((r) => r.torque === "peak")
        ? "\n\nNo humanoid-tagged entry documents a rated torque this high. Holding this load continuously needs a larger actuator, more reduction, a linkage with mechanical advantage, or a duty cycle confirmed against the peak rating."
        : "";
    const compare =
        ids.length >= 2
            ? ` ${mdLink(`Compare these ${ids.length}`, compareLink(ids))}.`
            : "";
    return `${head}\n\n**Catalog screen** (${list.total} humanoid-tagged ${list.total === 1 ? "entry passes" : "entries pass"}; ${peakOnly ? "lightest first" : "lightest rated fits first"}):\n\n${rows.join("\n")}${peakOnly}\n\n${compare.trim()}`.trim();
}

function unknownsNote(): string {
    const missing = undocumentedHumanoidEntries();
    if (!missing.length) return "";
    const names = missing
        .map((a) => mdLink(displayName(a), actuatorPath(a.id)))
        .join(", ");
    return `\n- **Torque for every tagged entry.** These humanoid-tagged entries document no torque, so they never pass a screen: ${names}. Most are drives or reducers that need a motor or driver to form a joint.`;
}

export function humanoidGuideBody(): string {
    let body = template;
    for (const j of JOINTS) body = body.replace(`{{joint:${j.id}}}`, jointBlock(j));
    return body.replace("\n\n## Next steps", `${unknownsNote()}\n\n## Next steps`);
}

const TITLE = "Humanoid robot actuators: joint-by-joint guide";
const DESCRIPTION =
    "Humanoid robot actuators by joint: static torque estimates for hip, knee, ankle, shoulder, elbow and wrist, with catalog shortlists and open unknowns.";
const UPDATED = "2026-10-04";

export const HUMANOID_GUIDE: Page = {
    path: HUMANOID_GUIDE_PATH,
    // The joint map is a React figure drawn by the /robots renderer; the
    // guide text from "How to read this guide" on stays below it.
    kind: "spa",
    persistentFrom: "\n\n## How to read this guide",
    persistentLabel: "Method, joint estimates and shortlists",
    headingIds: true,
    fold: () => ({
        "how-to-read-this-guide": "Hypothetical 1.5 m, 50 kg robot; static floor",
        ...Object.fromEntries(
            JOINTS.map((j) => {
                const list = jointShortlist(j, Number.POSITIVE_INFINITY);
                const rated = list.rows.filter((r) => r.torque === "rated").length;
                const screen = list.total
                    ? `${list.total} pass, ${rated ? `${rated} rated` : "peak only"}`
                    : "none documented";
                return [j.id, `${j.torqueNm.toFixed(1)} N·m · ${screen}`];
            }),
        ),
        "what-this-guide-does-not-establish":
            "Installed parts, duty, best pick, envelope",
        "next-steps": "Compare, check sources, selection guide",
    }),
    title: TITLE,
    description: DESCRIPTION,
    ogType: "article",
    updatedAt: UPDATED,
    body: humanoidGuideBody,
    jsonLd: () => {
        const headline = template.split("\n")[0]?.replace(/^# /, "") ?? TITLE;
        return [
            {
                "@type": "TechArticle",
                "@id": `${absoluteUrl(HUMANOID_GUIDE_PATH)}#article`,
                url: absoluteUrl(HUMANOID_GUIDE_PATH),
                headline,
                description: DESCRIPTION,
                inLanguage: "en",
                author: { "@type": "Organization", name: "actuatorlist" },
                dateModified: UPDATED,
                mainEntityOfPage: absoluteUrl(HUMANOID_GUIDE_PATH),
                about: JOINTS.map((j) => ({
                    "@type": "Thing",
                    name: `Humanoid ${j.name.toLowerCase()} actuator`,
                })),
            },
            breadcrumbs([
                { name: "Home", path: "/" },
                { name: "Engineering guides", path: "/guides" },
                { name: "Humanoid robot actuators", path: HUMANOID_GUIDE_PATH },
            ]),
        ];
    },
};
