import {
    existsSync,
    readFileSync,
    readdirSync,
    statSync,
    writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { BenchmarkRun } from "@/benchmarks/types";
import {
    PROTOCOL_DOC,
    type RunFolder,
    benchmarkLicenceErrors,
    folderNameErrors,
    runsModule,
    sameModule,
    validateFolder,
} from "@/benchmarks/validate";
import { ACTUATORS } from "@/catalog";

// CI gate for data/benchmarks (`make validate_benchmarks`, part of `make ci`):
// every run folder must pass src/benchmarks/validate.ts, and
// src/benchmarks/runs.generated.ts must import exactly the folders on disk.
// `--write` regenerates that file after adding a run.

const ROOT = join(import.meta.dir, "..");
const DATA = join(ROOT, "data", "benchmarks");
const GENERATED = join(ROOT, "src", "benchmarks", "runs.generated.ts");

const dirs = (p: string) =>
    existsSync(p)
        ? readdirSync(p).filter((n) => statSync(join(p, n)).isDirectory())
        : [];

const folders: RunFolder[] = dirs(DATA).flatMap((actuatorId) =>
    dirs(join(DATA, actuatorId)).map((runId) => {
        const dir = join(DATA, actuatorId, runId);
        return {
            actuatorId,
            runId,
            files: readdirSync(dir),
            read: (name: string) => readFileSync(join(dir, name), "utf8"),
        };
    }),
);

// Folder names become import paths: refuse to generate from a bad one.
const errors: string[] = folderNameErrors(folders);
if (process.argv.includes("--write") && errors.length === 0) {
    writeFileSync(GENERATED, runsModule(folders));
    console.log(`Wrote ${GENERATED} (${folders.length} runs). Run make fmt next.`);
}

// Run dates are local calendar dates; a day of slack past UTC keeps a run
// dated today valid for contributors ahead of UTC.
const today = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
const runs: BenchmarkRun[] = [];
for (const f of folders) {
    const { run, errors: found } = validateFolder(f, ACTUATORS, today);
    if (run) runs.push(run);
    for (const e of found)
        errors.push(`data/benchmarks/${f.actuatorId}/${f.runId}: ${e}`);
}
errors.push(...benchmarkLicenceErrors(runs));

// The generated module must be exactly what --write would produce (imports
// and the RUNS array), up to formatting.
const current = existsSync(GENERATED) ? readFileSync(GENERATED, "utf8") : "";
if (folderNameErrors(folders).length === 0 && !sameModule(current, runsModule(folders)))
    errors.push(
        `src/benchmarks/runs.generated.ts is ${current ? "out of date" : "missing"}. Run: bun run scripts/validate-benchmarks.ts --write && make fmt`,
    );

for (const e of errors) console.log(`error: ${e}`);
if (errors.length > 0) {
    console.log(
        `Benchmark validation failed: ${errors.length} error(s). See ${PROTOCOL_DOC}.`,
    );
    process.exit(1);
}
console.log(
    `Benchmark validation passed: ${runs.length} runs on ${new Set(runs.map((r) => r.actuatorId)).size} actuators.`,
);
