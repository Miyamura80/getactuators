import { join } from "node:path";
import { getSdkBrand } from "@/sdk/brands";
import { SDK_DIMENSIONS, type SdkDimension } from "@/sdk/types";
import { CACHE, ROOT, type RawPost, readJson, writeJson } from "./common";

// Post labels: for each matched post and each brand it mentions, the SDK
// claims it makes (dimension, polarity, theme) plus a one-sentence paraphrase
// in our own words. No model API is called: a reviewer (a Claude Code session
// on 2026-11-03) read every matched post against LABEL_GUIDE and the result is
// committed in labels.json, keyed by post. `--steps=build --export` writes the
// posts that still lack labels to the cache for the next review.

export const LABELS_PATH = join(ROOT, "scripts", "sdk-signals", "labels.json");
export const LABELLED_BY =
    "Claude Code (one-off review session, 2026-11-03), reading each matched post against the labelling guide; no model API in the pipeline";
export const GUIDE_VERSION = "v1";

export const THEMES: Record<SdkDimension, readonly string[]> = {
    protocol: ["undocumented-protocol", "documented-protocol", "protocol-changes"],
    bindings: [
        "wrote-own-driver",
        "good-python-library",
        "good-cpp-library",
        "missing-bindings",
    ],
    ros: [
        "ros2-driver-works",
        "no-ros2-driver",
        "ros2-driver-bugs",
        "sim-models",
        "sim-to-real",
    ],
    docs: ["docs-outdated", "docs-chinese-only", "docs-clear", "missing-examples"],
    firmware: [
        "bricked-or-flashing-pain",
        "open-firmware",
        "config-tool",
        "calibration",
    ],
    support: ["slow-support", "responsive-support", "active-community", "abandoned"],
    reliability: ["bus-errors-timeouts", "jitter-dropouts", "stable-at-high-rate"],
};

export interface Label {
    brand: string;
    dimension: SdkDimension;
    polarity: "positive" | "negative";
    theme: string;
    claim: string;
}

export const LABEL_GUIDE = `Label developer posts about robot actuator SDKs.
For each post you get an id, the brands it mentions (id: name) and its text.
Return only claims the post itself makes about a listed brand's developer
software: SDK, drivers, bindings, communication protocol, ROS 2 support,
simulation models, documentation, firmware and config tools, vendor support,
or reliability of the communication bus. Ignore torque, price, mechanics,
shipping and anything about other brands. Questions with no stated experience
are not claims. A bug report counts as a negative claim on the dimension it
hurts, including a bug in a community library written for that brand. A
fix or workaround someone shares counts only if it says the SDK itself is
good or bad. Short first-hand remarks still count: "the control is really
stable" is a reliability claim, "the site is hard to follow in English" a
docs claim, praise for a maker's developers answering questions a support
claim, another project adopting a brand's bus protocol a protocol claim, and
a closed or proprietary software stack a protocol claim.

Dimensions:
- protocol: is the bus protocol (CAN, RS-485, TTL, EtherCAT frames) documented and stable
- bindings: official or usable libraries in Python, C++, Rust; having to write your own driver
- ros: ROS 2 drivers, ros2_control, URDF/MJCF/Isaac models, sim-to-real
- docs: documentation quality, language, examples, being outdated
- firmware: firmware openness, updating/flashing, config GUI, calibration tools
- support: vendor responsiveness, community activity, abandoned projects
- reliability: bus-off, timeouts, dropped packets, jitter, max reliable control rate

Themes per dimension: ${JSON.stringify(THEMES)}

For each claim write "claim": one plain sentence under 160 characters in your
own words. Never quote the post, never name the author, no em dashes.
Give a post an empty list when it makes no such claim.`;

interface Job {
    post: RawPost;
    brands: string[];
}

function valid(l: Label, brands: string[]): boolean {
    return (
        brands.includes(l.brand) &&
        (SDK_DIMENSIONS as readonly string[]).includes(l.dimension) &&
        (l.polarity === "positive" || l.polarity === "negative") &&
        typeof l.claim === "string" &&
        l.claim.length > 0
    );
}

// Committed labels for every job. Posts without an entry count as unread and
// contribute nothing; their count is printed so a refresh knows what to read.
export function labelsFor(jobs: Job[]): Map<string, Label[]> {
    const labels = readJson<Record<string, Label[]>>(LABELS_PATH, {});
    const missing = jobs.filter((j) => !(j.post.key in labels));
    if (missing.length)
        console.warn(
            `  ${missing.length} matched posts have no labels yet (run with --export)`,
        );
    return new Map(
        jobs.map((j) => [
            j.post.key,
            (labels[j.post.key] ?? []).filter((l) => valid(l, j.brands)),
        ]),
    );
}

// Unlabelled posts with their text, for a reviewer to read.
export function exportUnlabelled(jobs: Job[]): void {
    const labels = readJson<Record<string, Label[]>>(LABELS_PATH, {});
    const todo = jobs
        .filter((j) => !(j.post.key in labels))
        .map((j) => ({
            id: j.post.key,
            brands: j.brands.map((b) => `${b}: ${getSdkBrand(b)?.name ?? b}`),
            title: j.post.title,
            text: j.post.text.slice(0, 1500),
        }));
    writeJson(join(CACHE, "to-label.json"), {
        guide: LABEL_GUIDE,
        themes: THEMES,
        posts: todo,
    });
    console.log(`  wrote ${todo.length} posts to label in ${CACHE}/to-label.json`);
}
