import {
    FUNDS,
    INVESTORS_AS_OF,
    KINDS,
    KIND_LABEL,
    companyOf,
    sidelineFunds,
    tierOf,
} from "@/investors";
import { mdLink, mdTable } from "./md";

// Markdown twin of /investors: the funds grouped by their strongest actuated
// bet, then every round with its source.
export function investorsBody(): string {
    const groups = (["none", ...KINDS] as const).map((t) => {
        const names = FUNDS.filter((f) => tierOf(f) === t).map((f) => f.name);
        return `- **${KIND_LABEL[t]} (${names.length}):** ${names.join(", ")}`;
    });
    const rows = FUNDS.flatMap((f) =>
        f.deals.map((x) => [
            f.name,
            companyOf(x).name,
            KIND_LABEL[companyOf(x).kind],
            `${x.round}${x.year ? `, ${x.year}` : ""}`,
            x.lead ? "Led" : "Joined",
            x.source
                ? mdLink(new URL(x.source).hostname.replace(/^www\./, ""), x.source)
                : "Press reports",
        ]),
    );
    return `# Which top funds are still on the sidelines of actuation?

29 large venture funds, checked for any round in hardware that moves: actuator makers, robot makers that build their own actuators, or other robot hardware. Built from public funding announcements as of ${INVESTORS_AS_OF}.

**${sidelineFunds().length} of 29 have no actuated bet on record.**

## Funds by strongest bet

${groups.join("\n")}

## Rounds

${mdTable(["Fund", "Company", "Type", "Round", "Role", "Source"], rows)}

## Method

A fund with no rounds listed means public announcements and press did not name it in an actuator or robot hardware round. Paid databases (PitchBook, Crunchbase) were not checked, so small or undisclosed checks can be missing. "Robot hardware only" covers robot makers where nothing public says they build their own actuators. Mind Robotics counts as building its own actuators on the strength of its actuation and dyno-test job postings. HongShan (formerly Sequoia China) led a round in joint-actuator maker RobStride but has been a separate firm from Sequoia since 2023, so it is not counted.`;
}
