import { auditRegistry } from "@/supply-chain/audit";

// CI gate for the supply-chain registry: every number cited, every source id
// resolvable, every site inside its country, every source's data licence
// respected (src/supply-chain/licence.ts). Warnings (orphan sources,
// estimates without a method note) print but do not fail.

const { errors, warnings } = auditRegistry();
for (const w of warnings) console.log(`warning: ${w}`);
for (const e of errors) console.log(`error: ${e}`);
if (errors.length > 0) {
    console.log(`Citation audit failed: ${errors.length} error(s).`);
    process.exit(1);
}
console.log(`Citation audit passed (${warnings.length} warning(s)).`);
