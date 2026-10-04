import { expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import { actuatorBody } from "@/server/agent/catalog-md";
import { get } from "./agent-helpers";

test("known source limits qualify product cells without changing metadata summaries", () => {
    for (const a of ACTUATORS.filter(
        (a) => a.id === "cubemars-ak80-9" || /^(leaderdrive-|nidec-)/.test(a.id),
    )) {
        const body = actuatorBody(a);
        for (const label of a.id === "cubemars-ak80-9"
            ? ["Weight", "Torque density", "Encoder"]
            : ["Backlash", "Backdrivable", "Encoder"]) {
            const row = body
                .split("\n")
                .find((line) => line.startsWith(`| ${label} |`));
            expect(row).toContain(
                a.id === "cubemars-ak80-9"
                    ? "Revision conflict"
                    : "Legacy catalog placeholder; not a measured family rating",
            );
        }
        if (a.id === "cubemars-ak80-9")
            expect(body).toContain("**Legacy catalog / revision conflict:**");
        else
            expect(
                body.split("\n").find((line) => line.startsWith("| Rated torque |")),
            ).toContain("Family-level");
    }
});

test("all products publish bounded evidence status rather than blanket verification", async () => {
    for (const a of ACTUATORS) {
        const body = actuatorBody(a);
        expect(body).not.toContain("verified against sources");
        const label = ["cubemars-ak80-9", "myactuator-rmd-x8-pro-v2"].includes(a.id)
            ? "Revision conflict: unresolved"
            : /^(leaderdrive-(lcs|lhd|lhs)|nidec-(flexwave-wpg|smart-flexwave-srh))$/.test(
                    a.id,
                )
              ? "Family-level evidence: confirm variant"
              : a.verified
                ? "Catalog headline specs spot-checked: confirm revision"
                : "Unverified catalog: confirm sources";
        expect(body).toContain(`| Data status | ${label} |`);
        const html = await (await get(`/actuators/${a.id}`)).text();
        expect(html).toContain(label);
    }
});
