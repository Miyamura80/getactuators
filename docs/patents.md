# /patents: data pipeline

The patent landscape (issue #96) counts patent families since 2010 per
actuator and magnet technology. Nothing is fetched at page load: a script
queries BigQuery and commits an aggregated snapshot.

```
src/patents/technologies.ts  CPC code sets + keyword filters (the scope)
        |
        v
scripts/patents/sql.ts  ->  scripts/patents/queries/landscape.sql (committed, generated)
        |
        v  BigQuery: patents-public-data.patents.publications (one scan)
family rows (never committed)
        |
        v  scripts/patents/aggregate.ts + src/patents/assignees.ts
src/patents/data/landscape.json (aggregates only)
        |
        +--> /patents (React), /patents.md, /api/v1/patents, MCP get_patent_landscape
```

## Choices

- **Family deduplication**: one row per `family_id` (DOCDB family). Rows with
  family `-1` are dropped.
- **Priority date**: the earliest `priority_date` among the family's
  publications in scope.
- **Applicant country**: the country of the first harmonised assignee on the
  family's earliest publication that names one.
- **Keyword filters**: generic codes (planetary gearing, screws, gearmotors,
  piezo actuators, motor-pump units) only count a family whose English title
  or abstract mentions a robot or muscle term. Families with no English text
  fail those filters.
- **Assignees**: `src/patents/assignees.ts` folds spellings and subsidiaries
  into one organisation and links it to the supply-chain company registry.
  Unknown names are kept, minus legal-form suffixes.
- **Top families**: the 200 most recent per technology (the public table has
  no value score to rank by).
- **Publication lag**: priority years within 18 months of the snapshot date
  are shaded and excluded from growth rates.

## Running it

```bash
export PATENTS_GCP_PROJECT=<billing project>
export GCP_ACCESS_TOKEN=$(gcloud auth print-access-token)  # optional
bun scripts/patents/fetch.ts --dry-run   # bytes scanned
bun scripts/patents/fetch.ts             # writes src/patents/data/landscape.json
```

Or paste `scripts/patents/queries/landscape.sql` into the BigQuery console,
export the result as JSON and run
`bun scripts/patents/fetch.ts --from-file rows.json --collected-at YYYY-MM-DD`.

After changing a code set, run `bun scripts/patents/fetch.ts --write-queries`;
a test fails if the committed query drifts from `technologies.ts`.

## Cross-checks

Spot-check one year per technology against Lens.org (or USPTO PatentsView)
with the same CPC codes and record each in `scripts/patents/cross-checks.json`:

```json
[{ "technology": "strain-wave", "year": 2020, "source": "lens", "bigquery": 0, "other": 0, "url": "https://www.lens.org/..." }]
```

The next fetch copies them into the snapshot, and the twin prints them.

## Going live

Until `collectedAt` is set the page is served with `noindex`, kept out of the
sitemap and llms.txt, and shows the scope only. Once a snapshot is committed
those switch on by themselves; add `/patents` to the footer in
`src/public-navigation.ts` (and regenerate the frontend fixtures with
`bun frontend/tests/capture-seo-pages.ts`) in the same PR.

The CPC code sets were written from the CPC scheme without an online check
(the build environment could not reach it). Review each symbol against
https://www.cooperativepatentclassification.org before the first run.
