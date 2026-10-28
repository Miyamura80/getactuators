import { join } from "node:path";
import { sdkCatalog } from "@/sdk/catalog";
import { scoreSnapshot } from "@/sdk/score";
import type { EvidenceFile } from "@/sdk/types";
import { classifyForumPosts } from "./classify";
import { collectCatalogDocs } from "./collect-catalog";
import { collectForums } from "./collect-forums";
import { collectGithub } from "./collect-github";
import { collectGithubRest } from "./collect-github-rest";

// `make sdk_signals`: re-runs every collector, the classifier and the rubric,
// then rewrites src/sdk/data/sdk-evidence.json and sdk-scores.json. The page
// reads only those files; nothing is scraped at page load.
//
//   SDK_SIGNALS_AS_OF=2026-10-28   date the snapshot is "as of" (default today)
//   SDK_SIGNALS_CACHE=/tmp/x       where partial clones go
//   GITHUB_TOKEN, REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, GEMINI_API_KEY

const DATA = join(import.meta.dir, "../../src/sdk/data");
const asOf = process.env.SDK_SIGNALS_AS_OF ?? new Date().toISOString().slice(0, 10);
const since = new Date(Date.parse(asOf) - 365 * 864e5).toISOString().slice(0, 10);

console.log(`sdk-signals as of ${asOf} (activity since ${since})`);
console.log("GitHub (git)");
const github = await collectGithub(since);
console.log("GitHub (REST)");
const rest = await collectGithubRest();
const catalog = collectCatalogDocs();
console.log("Forums");
const forums = await collectForums();

const evidence = [
    ...github.evidence,
    ...rest.evidence,
    ...catalog.evidence,
    ...forums.evidence,
];
const classifier = await classifyForumPosts(evidence);
evidence.sort((a, b) => a.brand.localeCompare(b.brand) || a.id.localeCompare(b.id));

const file: EvidenceFile = {
    asOf,
    collectors: [github.run, rest.run, catalog.run, ...forums.runs],
    classifier,
    evidence,
};
const scores = scoreSnapshot(file, sdkCatalog());

await Bun.write(join(DATA, "sdk-evidence.json"), `${JSON.stringify(file, null, 2)}\n`);
await Bun.write(join(DATA, "sdk-scores.json"), `${JSON.stringify(scores, null, 2)}\n`);
for (const c of file.collectors)
    console.log(`${c.status.padEnd(8)} ${c.label}: ${c.detail}`);
console.log(`classifier: ${classifier.status} (${classifier.detail})`);
console.log(`${evidence.length} evidence items, ${scores.brands.length} brands`);
