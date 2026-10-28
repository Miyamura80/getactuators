// Weekly price snapshot: read every catalog actuator's listed price from its
// product_url, convert to USD with the day's ECB rate and append to
// data/prices/history.json. Writes the PR body to --report. Runs locally too:
//
//   bun run scripts/price-snapshot/snapshot.ts [--only id1,id2] [--report out.md] [--dry-run]

import { readFileSync, writeFileSync } from "node:fs";
import type { PricedActuator } from "../../src/prices/types";
import { politeFetcher } from "./fetcher";
import { fxRates } from "./fx";
import {
    CATALOG_PATH,
    appendHistory,
    cliArgs,
    readHistory,
    today,
} from "./history-file";
import { type Outcome, readProduct } from "./read";
import { latestPriced, reportMarkdown } from "./report";

if (import.meta.main) {
    const { only, report, dryRun } = cliArgs(process.argv);
    const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as PricedActuator[];
    const targets = catalog.filter((a) => a.product_url && (!only || only.has(a.id)));
    const fetchText = politeFetcher();
    const fx = fxRates(fetchText);
    const date = today();
    const outcomes: Outcome[] = [];
    for (const a of targets) {
        const o = await readProduct(a, date, fetchText, fx);
        console.log(
            o.kind === "price"
                ? `${a.id}: ${o.point.priceUsd ?? "out of stock"} (${o.point.method})`
                : `${a.id}: FAILED ${o.reason}`,
        );
        outcomes.push(o);
    }
    const previous = latestPriced(readHistory().points);
    const body = reportMarkdown(`Price snapshot ${date}`, outcomes, previous, []);
    if (report) writeFileSync(report, body);
    else console.log(body);
    const points = outcomes.flatMap((o) => (o.kind === "price" ? [o.point] : []));
    if (!dryRun) appendHistory(points, [], date);
}
