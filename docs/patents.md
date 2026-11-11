# /patents methodology

`/patents` maps patent families since 2010 in ten actuator technologies. Its
data is committed under `data/patents/` and rebuilt by hand from a BigQuery
extract; nothing is fetched at page load.

```
patents-public-data.patents.publications (BigQuery, CC BY 4.0)
        |
        |  scripts/patents/queries/extract.sql
        |  priority date >= 2010, broad CPC superset
        v
gzipped NDJSON export (one row per publication, never committed)
        |
        |  scripts/patents/build-landscape.ts
        |    group by family_id -> one family
        |    src/patents/technologies.ts -> technologies (or drop)
        |    src/patents/assignees.ts    -> normalised first assignee
        v
data/patents/landscape.json   counts per technology x year x country, top 15 assignees
data/patents/families.json    top 200 families per technology
        |
        v
/patents page, /patents.md, /api/v1/patents/{technology}, MCP get_patent_landscape
```

## Rebuild

1. Run `scripts/patents/queries/extract.sql` in BigQuery with your project id
   and bucket. The `EXPORT DATA` statement writes `part-*.json.gz` files.
2. `bun run scripts/patents/build-landscape.ts --input=<path-or-url>[,<more>] --as-of=<extract date>`.
   With no `--input` it reads the public export at
   `storage.googleapis.com/actuatorlist-patents-patents-extract`.
3. Commit the two JSON files. `make citation_audit` and `tests/patents/` check them.

## Choices

- **Family**: publications grouped by DOCDB `family_id`; each family counts once
  per technology, and once in "All technologies" whatever its technologies.
- **Priority date**: the earliest priority date of any publication in the family.
- **Technology**: a family belongs to a technology when any of its
  publications carries one of the technology's CPC codes (prefix match). Codes
  marked filtered also need a title keyword or a co-code; some technologies
  exclude titles (NdFeB leaves out iron nitride and rare-earth-free titles).
  The extract's superset bounds what can match: a code outside it, such as
  `H01F1/11` hard ferrites, only finds families the superset caught through
  another code, so rare-earth-free magnets are undercounted.
- **Applicant country**: the country of the first assignee on the family's
  earliest publication that lists one, read from any publication of the family
  that gives it. Google's harmonised assignee country is often blank (most
  Chinese filings), so the fallback is the office of the earliest national
  publication (not EP or WO), then `XX` (unknown).
- **Assignee**: harmonised name, cleaned of case and legal-form suffixes, then
  grouped by the alias table (subsidiaries under today's parent; registry
  company ids where they exist). Only the first assignee counts, so
  co-applicants get no credit and shares add up to at most 100%.
- **Publication lag**: applications publish about 18 months after priority.
  Priority dates from 18 months before the extract date are shaded as
  incomplete, and 3-year CAGR uses the last fully published year.
- **Family list**: the 200 families per technology filed at the most offices
  (countries, EP, WO), then most publications. Links go to Google Patents,
  which drops the hyphens in the publication number.

## Open items

- TODO: cross-check per-technology family counts against Lens.org on a sample
  of CPC codes. The build environment had no route to lens.org, so this has not
  been done; the issue (#96) asks for it.
- TODO: USPTO PatentsView sample check of US assignee normalisation.
