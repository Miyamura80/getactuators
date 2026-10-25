# Supply-chain atlas: data and page recipe

The supply-chain pages (`/metals`, `/bom`, `/manufacturing`, `/alts`, `/japan`,
`/china`, `/korea`, `/us`) share one cited registry and one set of components.
Pages hold content; numbers live in the registry and are referenced by id.

```
 src/supply-chain/
 +-- sourced.ts        Sourced<T>: value + sources + asOf + confidence
 +-- sources.ts        SourceRef registry (id -> publisher, title, url, accessed)
 +-- schemas.ts        zod schemas for every record (kept out of the browser bundle)
 +-- stages.ts         mining | separation | metal-alloy | magnet | motor | ...
 +-- countries.ts      ISO codes with bounding boxes (site pins are checked)
 +-- companies/        Company records (segment, stages, ownership, revenue)
 +-- sites/            HQs, plants, mines with lat/lon and pin precision
 +-- links.ts          SupplyLink: who sells what to whom
 +-- registry.ts       accessors: getCompany, companiesIn, sitesOf, linksOf, find*
 +-- concentration.ts  normalizeShares, concentration(shares) -> top, HHI
 +-- market-share.ts   cited company share of one market per segment
 +-- format.ts         value formatting shared by React and markdown
 +-- audit.ts          integrity checks behind tests and scripts/citation-audit.ts
 +-- views.ts          REST and MCP wire shapes
```

## Rules for data

- Every number is a `Sourced<T>`. A bare number fails `make citation_audit`
  (part of `make ci`); only `lat`/`lon` are exempt because the site cites its
  own sources.
- `confidence` is `reported` (the source publishes the figure), `estimated`
  (the source's estimate, or a currency conversion of a reported figure) or
  `modeled` (computed here). Estimates and models need a `note` or a `range`.
- Add the document to `SOURCES` first. Ids are kebab-case
  `<publisher>-<topic>-<year>` and never change. Cite only public material; mark
  `paywalled: true` when only an excerpt is public.
- Never invent a figure. Leave the field out when no public source has it.
- Pages never filter the raw arrays: add an accessor to `registry.ts`.

## How a number looks

| Confidence | React (`SourcedValue`) | Markdown twin (`footnotes()`) |
|------------|------------------------|-------------------------------|
| reported   | `224.4M` plus footnote | `$224.4M[^3]` |
| estimated  | `~5.8-6B`, dotted underline | `~$5.8-6B[^4] (estimate, 2025)` |
| modeled    | dimmed, `model` tag | `5,053[^1] (model, 2025)` |

Footnotes are numbered in first-cited order on both surfaces, and
`<SourcesSection>` / `footnotes().section()` list them at the end.

## Country share by stage

`<StageShareBar rows>` draws one stacked bar per stage, countries largest
first and the unattributed rest as a grey "Other". The bar itself shows
whether one country dominates; there is no separate badge. Segments carry
flag emoji from `countryFlag(code)` in `countries.ts`, with the country name
as the accessible label (use `<Flag code>` in React).

`concentration(shares)` returns the top country and the HHI over named
countries for markdown twins and modeled values (fractions or raw amounts;
the `other` key is unattributed volume).

## Market share by segment

`src/supply-chain/market-share.ts` holds one market per segment (for example
rare earth mine production or humanoid robot shipments) with a cited share per
company. `<MarketShareList>` renders a thin bar and the percentage per company,
a dash where no public share exists, and "Other" for the rest. The audit checks
each share belongs to a company in that segment and that shares add up to at
most 100%. Never fill a gap with a guess: leave the company out of `shares`.

## The kit page

Every kit component renders with fixtures on the hidden `/lab/supply-chain`
page (noindex, not in the sitemap or llms.txt); check it after changing any
of them. `<SourcesSection>` is a `<details>` closed by default; footnote links
open it before scrolling to the entry.

## Adding a page

1. **Dataset** under `src/supply-chain/<area>/index.ts` exporting `PATH` and
   `AS_OF` constants. Register it in `DATASETS` in `src/supply-chain/audit.ts`
   so the citation audit walks it.
2. **Markdown body** in `src/server/agent/supply-chain/<area>.ts`. Build every
   number with `footnotes().value(...)` and end with `fn.section()`.
3. **Page entry** in `STATIC_PAGES` in `src/server/agent/pages.ts`:
   `kind: "spa"`, JSON-LD `Dataset` plus `WebPage`, and an OG image.
4. **Route**: add the path to `PAGE_PATHS` in `src/server/routes/pages.ts`.
5. **React page** in `frontend/src/pages/supply-chain/`, wrapped in
   `<FootnotesProvider>` with `<SourcesSection />` last, and its route in
   `frontend/src/startup.tsx`. The Dockerfile already copies
   `src/supply-chain/` into the frontend build stage; keep browser imports to
   data modules (never `schemas.ts` or `views.ts`, which pull in zod).
6. **Navigation**: add the path to `SUPPLY_CHAIN_PAGES_LIVE` in
   `src/public-navigation.ts`. The header menu and footer group appear once the
   set is non-empty.
7. **Agent access**: an MCP tool in `src/mcp/tools/supply-chain.ts` and a REST
   operation in `src/api/operations.ts` (OpenAPI is generated from it). Reuse
   the wire shapes in `src/supply-chain/views.ts`.
8. **Tests**: `tests/server/<area>.test.ts` (page, twin, API, MCP) and
   `frontend/tests/<area>.test.tsx`; desktop and 390 px screenshots in the PR.

## Generic agent access

| Surface | Call |
|---------|------|
| MCP | `list_companies(country?, stage?, segment?)`, `get_company(id)`, `list_sites(country?, stage?, company?, kind?)` |
| REST | `GET /api/v1/companies`, `GET /api/v1/companies/{id}`, `GET /api/v1/sites` |

Every number in a response carries `as_of`, `confidence`, `note` and the full
source references.
