import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { validateBenchmarkDir } from "../src/benchmarks/validate";

// Validates every benchmark run under data/benchmarks and checks that
// src/benchmarks/runs.generated.json (what the site serves) matches them.
//
//   bun run scripts/validate-benchmarks.ts          # check (make ci)
//   bun run scripts/validate-benchmarks.ts --write  # regenerate the bundle

const ROOT = join(import.meta.dir, "..");
const DATA_DIR = join(ROOT, "data", "benchmarks");
const BUNDLE = join(ROOT, "src", "benchmarks", "runs.generated.json");

const { runs, errors } = validateBenchmarkDir(DATA_DIR);
if (errors.length > 0) {
    console.error(`Benchmark validation failed (${errors.length}):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
}

const expected = `${JSON.stringify({ runs }, null, 4)}\n`;
if (process.argv.includes("--write")) {
    writeFileSync(BUNDLE, expected);
    console.log(`Wrote ${runs.length} runs to src/benchmarks/runs.generated.json`);
    process.exit(0);
}

let current = "";
try {
    current = readFileSync(BUNDLE, "utf8");
} catch {
    // Missing bundle is reported below.
}
if (JSON.stringify(JSON.parse(current || "{}")) !== JSON.stringify({ runs })) {
    console.error(
        "src/benchmarks/runs.generated.json is out of date. Run: bun run scripts/validate-benchmarks.ts --write",
    );
    process.exit(1);
}
console.log(`${runs.length} benchmark runs valid.`);
