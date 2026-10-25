import {
    CONTRIBUTIONS_AS_OF,
    CONTRIBUTORS_PATH,
    type Person,
    contributionStats,
    orgOf,
    peopleIn,
} from "@/people";
import { REPO_URL, absoluteUrl } from "../site";
import { bullets, mdLink } from "./md";

// Markdown twin and JSON-LD for /contributors, from the shared people registry.

const LINK_LABEL: Record<Person["links"][number]["kind"], string> = {
    github: "GitHub",
    web: "Website",
    x: "X",
    linkedin: "LinkedIn",
    scholar: "Scholar",
};

function line(p: Person): string {
    const org = orgOf(p);
    const stats = contributionStats(p);
    const links = p.links.map((l) => mdLink(LINK_LABEL[l.kind], l.url)).join(", ");
    return [
        `**${p.name}**, ${p.role}, ${mdLink(org.name, org.url)}.`,
        p.contribution,
        stats ? `${stats}.` : "",
        links,
    ]
        .filter(Boolean)
        .join(" ");
}

export function contributorsBody(): string {
    return [
        "# Contributors",
        `The people who build actuatorlist. Commit counts come from the repository's git history as of ${CONTRIBUTIONS_AS_OF}.`,
        `## Core\n\n${bullets(peopleIn("contributor-core").map(line))}`,
        `## Contributors\n\n${bullets(peopleIn("contributor").map(line))}`,
        `## Contribute\n\nOpen an issue or pull request on ${mdLink("GitHub", REPO_URL)}. To change or remove an entry on this page, use the ${mdLink("contact page", absoluteUrl("/contact"))}.`,
    ].join("\n\n");
}

export function personId(p: Person): string {
    return `${absoluteUrl(CONTRIBUTORS_PATH)}#${p.id}`;
}

export function contributorPeople(): Person[] {
    return [...peopleIn("contributor-core"), ...peopleIn("contributor")];
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
