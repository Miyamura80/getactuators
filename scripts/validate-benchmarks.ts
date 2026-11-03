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
    runsModule,
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

if (process.argv.includes("--write")) {
    writeFileSync(GENERATED, runsModule(folders));
    console.log(`Wrote ${GENERATED} (${folders.length} runs). Run make fmt next.`);
}

const today = new Date().toISOString().slice(0, 10);
const errors: string[] = [];
const runs: BenchmarkRun[] = [];
for (const f of folders) {
    const { run, errors: found } = validateFolder(f, ACTUATORS, today);
    if (run) runs.push(run);
    for (const e of found)
        errors.push(`data/benchmarks/${f.actuatorId}/${f.runId}: ${e}`);
}
errors.push(...benchmarkLicenceErrors(runs));

// The generated module must import exactly the folders on disk.
const imported = new Set(
    [
        ...readFileSync(GENERATED, "utf8").matchAll(
            /"\.\.\/\.\.\/data\/benchmarks\/([^/"]+)\/([^/"]+)\/run\.json"/g,
        ),
    ].map((m) => `${m[1]}/${m[2]}`),
);
const onDisk = new Set(folders.map((f) => `${f.actuatorId}/${f.runId}`));
const stale = [...onDisk].filter((k) => !imported.has(k));
const gone = [...imported].filter((k) => !onDisk.has(k));
if (stale.length > 0 || gone.length > 0)
    errors.push(
        `src/benchmarks/runs.generated.ts is out of date (missing: ${stale.join(", ") || "none"}; removed: ${gone.join(", ") || "none"}). Run: bun run scripts/validate-benchmarks.ts --write && make fmt`,
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
