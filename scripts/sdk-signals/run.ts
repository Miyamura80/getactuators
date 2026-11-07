import { FORUMS, type Forum } from "@/sdk/types";
import { build } from "./build";
import { collect } from "./collect";
import { objectiveChecks } from "./objective";

// /sdk seeding pipeline (`make sdk_signals`). Steps run in order:
//   collect    Reddit, Hacker News, ROS Discourse and GitHub issues -> cache
//   objective  repository stats and source URL checks -> sdk-github.json
//   build      match, committed labels, gold-set gate, score -> sdk-*.json
//              (--export writes posts that lack labels to the cache)
// Flags: --steps=collect,objective,build  --forums=hn,github  --gold-sample
//        --export --refresh (re-read repository stats)
// Env: REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET (Reddit, optional),
//      GITHUB_TOKEN (optional, rate limit). No model API is called.

const args = process.argv.slice(2);
const flag = (name: string) =>
    args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const STEPS = ["collect", "objective", "build"];

// A comma-separated flag whose every value must be one of `allowed`; a typo
// stops the run instead of silently doing nothing.
function list(name: string, allowed: readonly string[]): string[] {
    const raw = flag(name);
    if (raw === undefined) return [...allowed];
    const values = raw.split(",").filter(Boolean);
    const bad = values.filter((v) => !allowed.includes(v));
    if (values.length === 0 || bad.length)
        throw new Error(
            `--${name}: ${bad.length ? `unknown ${bad.join(", ")}` : "empty"}; expected some of ${allowed.join(",")}`,
        );
    return values;
}

const steps = list("steps", STEPS);
const forums = list("forums", FORUMS) as Forum[];

if (steps.includes("collect")) await collect(forums);
if (steps.includes("objective")) {
    console.log("objective checks");
    await objectiveChecks(args.includes("--refresh"));
}
if (steps.includes("build")) {
    console.log("build");
    await build({
        sample: args.includes("--gold-sample"),
        export: args.includes("--export"),
    });
}
