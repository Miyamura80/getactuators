import {
    CONTRIBUTORS,
    CONTRIBUTORS_PATH,
    LINK_LABEL,
    type Person,
    orgOf,
} from "@/people";
import { REPO_URL, absoluteUrl } from "../site";
import { bullets, mdLink } from "./md";

// Markdown twin and JSON-LD for /contributors, from the shared people registry.

function line(p: Person): string {
    const org = orgOf(p);
    const links = p.links.map((l) => mdLink(LINK_LABEL[l.kind], l.url)).join(", ");
    return `**${p.name}**, ${p.role}, ${mdLink(org.name, org.url)}.${links ? ` ${links}` : ""}`;
}

function section(heading: string, kind: Person["contributor"]): string {
    return `## ${heading}\n\n${bullets(CONTRIBUTORS.filter((p) => p.contributor === kind).map(line))}`;
}

export function contributorsBody(): string {
    return [
        "# Contributors",
        "The people who build actuatorlist and their affiliations.",
        section("Core", "core"),
        section("Contributors", "member"),
        `## Contribute\n\nOpen an issue or pull request on ${mdLink("GitHub", REPO_URL)}. To change or remove an entry on this page, use the ${mdLink("contact page", absoluteUrl("/contact"))}.`,
    ].join("\n\n");
}

export function personId(p: Person): string {
    return `${absoluteUrl(CONTRIBUTORS_PATH)}#${p.id}`;
}

export function personNode(p: Person): Record<string, unknown> {
    const org = orgOf(p);
    return {
        "@type": "Person",
        "@id": personId(p),
        name: p.name,
        jobTitle: p.role,
        affiliation: { "@type": "Organization", name: org.name, url: org.url },
        ...(p.headshot ? { image: absoluteUrl(p.headshot.path) } : {}),
        ...(p.links.length ? { sameAs: p.links.map((l) => l.url) } : {}),
    };
}
