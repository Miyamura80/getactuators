import { existsSync } from "node:fs";
import { join } from "node:path";
import { DIMENSIONS } from "@/sdk/rubric";
import {
    type ClassifierRun,
    DIMENSION_IDS,
    type DimensionId,
    type Evidence,
    type Polarity,
} from "@/sdk/types";
import { createGeminiClient, generateText } from "../lib/gemini-client";

// LLM classifier for forum posts (Gemini via @google/genai): which SDK
// dimension a post is about and whether it is positive, negative or neutral.
// Labels only count once the classifier agrees with the hand-labelled gold
// set (gold.json) on at least 80% of posts in every dimension; until then
// posts keep their keyword tags and polarity stays null.

const GOLD_PATH = join(import.meta.dir, "gold.json");
const MODEL = process.env.SDK_CLASSIFIER_MODEL ?? "gemini-2.5-flash";
const THRESHOLD = 0.8;
const GOLD_TARGET = 150;

interface GoldItem {
    quote: string;
    brand: string;
    dimension: DimensionId;
    polarity: Polarity;
}

interface Label {
    dimension: DimensionId;
    polarity: Polarity;
}

const PROMPT = (
    brand: string,
    quote: string,
) => `You label developer forum posts about robot actuator SDKs.
Brand: ${brand}
Post excerpt: """${quote}"""
Dimensions: ${DIMENSIONS.map((d) => `${d.id} (${d.label})`).join("; ")}.
Reply with JSON only: {"dimension": one of [${DIMENSION_IDS.join(", ")}], "polarity": "positive" | "negative" | "neutral"} for what the post says about the brand's SDK.`;

async function label(
    client: ReturnType<typeof createGeminiClient>,
    brand: string,
    quote: string,
): Promise<Label | null> {
    const raw = await generateText(client, MODEL, PROMPT(brand, quote));
    const json = /\{[\s\S]*\}/.exec(raw)?.[0];
    if (!json) return null;
    const parsed = JSON.parse(json) as Partial<Label>;
    const okDim = DIMENSION_IDS.includes(parsed.dimension as DimensionId);
    const okPol = ["positive", "negative", "neutral"].includes(parsed.polarity ?? "");
    return okDim && okPol ? (parsed as Label) : null;
}

function notRun(detail: string, goldSetSize = 0): ClassifierRun {
    return { status: "not-run", model: null, goldSetSize, agreement: null, detail };
}

// Share of gold posts per dimension where dimension and polarity both match.
async function goldAgreement(
    client: ReturnType<typeof createGeminiClient>,
    gold: GoldItem[],
): Promise<Partial<Record<DimensionId, number>>> {
    const hits: Partial<Record<DimensionId, [number, number]>> = {};
    for (const g of gold) {
        const l = await label(client, g.brand, g.quote);
        const [right, total] = hits[g.dimension] ?? [0, 0];
        const correct = l?.dimension === g.dimension && l.polarity === g.polarity;
        hits[g.dimension] = [right + (correct ? 1 : 0), total + 1];
    }
    return Object.fromEntries(
        Object.entries(hits).map(([d, [right, total]]) => [
            d,
            Math.round((right / total) * 100) / 100,
        ]),
    ) as Partial<Record<DimensionId, number>>;
}

// Returns the run record and, when the gold set passes, labels every forum item.
export async function classifyForumPosts(evidence: Evidence[]): Promise<ClassifierRun> {
    const gold: GoldItem[] = existsSync(GOLD_PATH)
        ? await Bun.file(GOLD_PATH).json()
        : [];
    if (gold.length < GOLD_TARGET)
        return notRun(
            `Gold set has ${gold.length} of the ${GOLD_TARGET} hand-labelled posts needed; forum posts keep keyword tags and no polarity.`,
            gold.length,
        );
    if (!process.env.GEMINI_API_KEY)
        return notRun("GEMINI_API_KEY not set.", gold.length);
    const client = createGeminiClient();
    const agreement = await goldAgreement(client, gold);
    const passed = Object.values(agreement).every((a) => a >= THRESHOLD);
    const run: ClassifierRun = {
        status: passed ? "ok" : "below-threshold",
        model: MODEL,
        goldSetSize: gold.length,
        agreement,
        detail: passed
            ? `Agreement at or above ${THRESHOLD * 100}% in every dimension; forum posts labelled.`
            : `Agreement below ${THRESHOLD * 100}% in at least one dimension; labels not used.`,
    };
    if (!passed) return run;
    for (const e of evidence.filter((x) => x.signal === "forum-mention" && x.quote)) {
        const l = await label(client, e.brand, e.quote ?? "");
        if (!l) continue;
        e.polarity = l.polarity;
        e.dimensions = [...new Set([l.dimension, ...(e.dimensions ?? [])])];
    }
    return run;
}
