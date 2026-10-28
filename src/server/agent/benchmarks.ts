import { BENCHMARKS_PATH } from "@/benchmarks";
import { SITE_URL, absoluteUrl } from "../site";
import { DESCRIPTION, TITLE, benchmarksBody } from "./benchmarks-md";
import * as ld from "./jsonld";
import type { Page } from "./page-types";

// /benchmarks page record: metadata and JSON-LD around the markdown twin.

export const BENCHMARKS_PAGE: Page = {
    path: BENCHMARKS_PATH,
    kind: "spa",
    title: TITLE,
    description: DESCRIPTION,
    body: benchmarksBody,
    jsonLd: () => [
        ld.webPage("CollectionPage", BENCHMARKS_PATH, TITLE),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: TITLE, path: BENCHMARKS_PATH },
        ]),
        {
            "@type": "Dataset",
            "@id": `${SITE_URL}${BENCHMARKS_PATH}#runs`,
            name: "Measured robot actuator benchmarks",
            description:
                "Measured torque, thermal holds, backlash and other test results for catalog actuators, from published tests and community dyno runs, each with its source and rig.",
            url: absoluteUrl(BENCHMARKS_PATH),
            isAccessibleForFree: true,
            license: "https://opensource.org/licenses/MIT",
            distribution: [
                {
                    "@type": "DataDownload",
                    encodingFormat: "application/json",
                    contentUrl: absoluteUrl("/api/v1/benchmarks"),
                },
                {
                    "@type": "DataDownload",
                    encodingFormat: "text/markdown",
                    contentUrl: absoluteUrl(`${BENCHMARKS_PATH}.md`),
                },
            ],
        },
    ],
};
