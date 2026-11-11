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
        |    kind codes + offices        -> granted / 2+ offices / triadic
        |    src/patents/application-areas.ts -> application areas (CPC)
        v
data/patents/landscape.json   counts per technology x year x country (all and
                              per quality filter), top 15 assignees, top 40
                              value rows, application-area counts
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

## Is the activity economically real?

Three views on `/patents` test whether a filing count means paid-for
protection. All of them count priority years 2010 to the last complete year
(the stream also draws the incomplete years, greyed out).

- **Granted**: some publication in the family has a kind code starting B or C
  (B1, B2, C, C1). Utility models (kind U, and Y for older Chinese ones) never
  count, whatever the office.
- **Filed in 2+ offices** (`intl`): the family was published by at least two
  distinct offices other than WO. EP counts as one office. Filing abroad costs
  translation and fees, so it is a cheap proxy for value.
- **Triadic** (`US+EP+JP`): the family was published by the US, European and
  Japanese offices.

```
Stream filter        All -> Granted -> 2+ offices -> US+EP+JP
                     (y axis fixed to the All maximum; ?filter=granted|intl|triadic)
Value vs volume      top 40 first assignees: x families (log), y share in 2+ offices,
                     bubble area granted; headline: CN vs non-CN share in 2+ offices
Where it ends up     technology -> application area (Flow, or Grid with the
                     2010-17 vs last-5-years shift; ?areas=flow|grid)
```

- **Application areas** come from CPC co-classification: a family is in an
  area when any CPC code on any of its publications matches the area's regular
  expression in `src/patents/application-areas.ts` (one-line rationale per
  area there). A family can sit in several areas or none. This is a proxy for
  use until citation data is added; an examiner adding B60 says the invention
  is claimed in a vehicle, not that it ships in one.
- The flow drops technology-area links under 15 families and says how many
  families that leaves out. The grid marks a cell with an arrow when the
  share moved by 1 point or more between 2010-2017 and the five years ending
  at the last complete year (`areaWindows` in `landscape.json`).
- Momentum compares the five complete years ending at the last complete year
  with the five before them (`momentumWindows` in `landscape.json`). Sizes
  and windows live in `src/patents/constants.ts`.
- Chinese means applicant country CN; unknown (`XX`) counts with the rest.

## Open items

- TODO: cross-check per-technology family counts against Lens.org on a sample
  of CPC codes. The build environment had no route to lens.org, so this has not
  been done; the issue (#96) asks for it.
- TODO: USPTO PatentsView sample check of US assignee normalisation.
- TODO: replace or complement CPC co-classification with forward citations
  once citation data is in the extract.
