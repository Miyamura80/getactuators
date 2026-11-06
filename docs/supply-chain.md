# Supply-chain atlas: data and page recipe

The supply-chain pages (`/metals`, `/policy`, `/manufacturing`, `/japan` and
`/korea` are live; `/bom`, `/alts`, `/china`, `/us` are planned;
`/lab/supply-chain` is the hidden kit page) share one cited registry and one set of components.
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
 +-- links.ts          SupplyLink: who sells what to whom (`ended` = historical)
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

`<WaffleGrid rows>` is the canonical "where is the chokepoint" visual: each
stage as 100 cells (one per percent) coloured by country, with a legend of
every country's flag and share under the grid, largest first and "Other"
last. The area itself shows whether one country dominates; there is no
separate badge. Segments carry
flag emoji from `countryFlag(code)` in `src/country-flag.ts`, with the country name
as the accessible label (use `<Flag code>` from `frontend/src/components/Flag.tsx`).

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

## Perspective

Visuals that put headline numbers next to references people know. Their
cited inputs live in `src/supply-chain/perspective.ts`; derived values (unit
translations) are `modeled` with their method in `note`. The lab page shows
them in this order:

| Component | Shows |
|-----------|-------|
| `<WithoutLeader>` | world supply with the leader's part drawn as gone ("If China stopped") |
| `<LeaderBars>` | the leader's share of each market, rare earths next to familiar markets |
| `<UnitTranslation>` | a tonnage as humanoids or EVs, one icon per million, against a benchmark |

`<WithoutLeader>` and `<LeaderBars>` read share maps from `DOMINANCE_MARKETS`
through `leaderOf` in `src/supply-chain/dominance.ts`. They use no derived
units.

## Map kit

`frontend/src/components/maps/`, d3-geo + d3-zoom over the TopoJSON in
`frontend/public/geo/` (Natural Earth; see its README). Map data comes from
`src/supply-chain/map.ts`: `sitePins()`, `supplyArcs()` (current links only,
anchored by `companyAnchor`), `arcsTouching(arcs, code)`, `NamedCluster`.

```
 <WorldMap values max toggle>          <CountryMap code="JP" sites={jpPins}>
   <Arcs arcs />                          <Arcs arcs={arcsTouching(arcs, "JP")} />
   <ClusterZoom labels="groups" ... />    <ClusterZoom pins={jpPins} clusters ... />
 </WorldMap>                            </CountryMap>
 <MapDrawer open title onClose>  useMapSelection() -> ?company= ?site= ?cluster=
```

| Component | Shows |
|-----------|-------|
| `<WorldMap>` | Pacific-centred choropleth (one cyan ramp), graticule, readout, slot for a stage toggle |
| `<CountryMap code sites>` | admin-1 outlines for JP, CN, KR or US, fitted to bounds, with a bright coastline, a scale bar and faint orientation cities (`REFERENCE_CITIES`: capital plus largest metros; `cities={false}` hides them). Given `sites`, regions shade by how many sites they hold (dim cyan ramp, hidden table "sites per region") and a key under the map lists the segments present with counts |
| `<Pins>` | buttons drawn as the segment's object tile (`<SegmentTile>`: a `SEGMENT_COLOR` tile with a `SEGMENT_PICTO` object knocked out: orange pickaxe REE, violet horseshoe magnet magnets/motors, ochre gear gears/screws/bearings, pink robot face OEM); a hollow dashed tile when `precision !== "site"`; company name beside each; hover or focus shows a monogram card with the site |
| `<Arcs>` | great-circle arcs; an arc leaving the map ends at the edge with a country chip (a link once that page is live) |
| `<ClusterZoom>` | groups pins closer than 28 px (then merges any group markers that would overlap), zooms to a group or a named cluster; a group marker is one button holding the tiles of the segments present in chain order, each with its site count above one (`<SegmentMix>`: a row for two segments, a 2 x 2 block for three or four; accessible name like "Baotou: 1 rare earth site, 2 magnet and motor sites. List them"), plus a callout naming what its members share (named cluster, else company, else region); lists named clusters under the map with the same tiles. `labels="groups"` keeps only the callouts (the world map) |
| `<MapDrawer>` | the selection panel (bottom sheet on phones) |

Segment tiles reuse the /policy object tile (`frontend/src/components/glyphs/ObjectTile.tsx`);
pictogram paths, `segmentMix` and `mixPhrase` live in `src/supply-chain/map.ts`, and
grouping plus group-marker size in `src/supply-chain/map-groups.ts`, so the
browser and the server-rendered SVG draw the same markers.

On-map text is placed in one pass per map (`labels.ts`): overlays hand their
candidates to the frame through `useMapLabels`, higher priority places first
(group callouts, then exact sites, then city-centre pins, then cities), each
tries right, left, above and below its marker, and a label that would cover a
marker, another label or a HUD corner is dropped rather than drawn on top.
Each marker registers its real size (`r`, and `ry` when not square: a group's
tile block), so labels clear the whole block.
Labels are `aria-hidden`; every marker keeps its full accessible name, and
they fade while a marker is hovered or focused.

Wheel zoom needs Ctrl/Cmd (the page keeps scrolling); pinch, drag, double
click and the +/-/fit buttons work as usual. Every layer adds a visually
hidden table. Pages pass `prerender` on their `Page` entry to put a static SVG
map (`worldMapSvg` in `src/server/agent/supply-chain/map-svg.ts`) in the HTML
before hydration, and list the same data as tables in the markdown twin.

## Flow kit

`frontend/src/components/flows/`, shared by `/bom` and `/manufacturing`.

| Component | Shows |
|-----------|-------|
| `<ValueSankey nodes links unit>` | band width = value; hover or focus lights a node's upstream and downstream paths; `onSelectNode`; `valueMax` fixes the scale across charts; top to bottom under 600 px |
| `<SupplyGraph nodes edges>` | layered company cards (monogram, name, flag, stage, badges); hover a card to read what flows on its edges |
| `<NodeBadge kind>` | `idiot-index` (`9.1x`), `margin` (`38%`), `concentration` (flag, meter, top share); a `Sourced` value keeps its confidence style and footnote |
| `<ProcessStepChip stepId>` | link to `/manufacturing#step=<id>` |
| `<StageShareBar shares label>` | one stage's country shares as a single stacked bar, top flags under it |
| `<ConcentrationBadge shares>` | tier word (monopolized 80%+, concentrated 50-80%, distributed) with the top flag and share (`concentrationTier` in `src/supply-chain/concentration-tier.ts`) |
| `<CompanyDrawer companyId onClose>` | company panel in `MapDrawer`: stages, products, revenue, links |
| `process-icons.tsx` | line pictograms per process step (`ProcessIcon`) |

`frontend/src/lib/supply-chain-selection.ts` keeps one selection per page in
the URL hash (`#step=` on /manufacturing, `#node=` on /bom):
`useSupplyChainSelection(key, isKnown)`.

## Process chains (/manufacturing)

```
 src/supply-chain/processes/
 +-- types.ts     ProcessChain: clusters, steps (label <= 4 words, caption <= 12),
 |                edges (main | branch | loop), product scene
 +-- magnet.ts    the NdFeB chain, ore to rotor segment; step ids are the /bom contract
 +-- sources.ts   the documents behind the chain's key numbers (spread into SOURCES)
 +-- path.ts      MANUFACTURING_PATH, the /manufacturing route
 +-- layout.ts    grid -> map boxes, cluster frames, edge curves, zoom detail
 +-- index.ts     PROCESS_CHAINS, getChain, isProcessStepId, processErrors
 +-- views.ts     REST / MCP wire shape (server only)
 src/supply-chain/scenes/magnet-loops.ts   the ProcessLoop vignettes + rotor explode
```

A new chain (#83) is a new file with the same schema appended to
`PROCESS_CHAINS`; the switcher, map, twin, REST and MCP pick it up. Country
shares on steps are keys into the /metals stage shares (`PROCESS_SHARES`), so
they are cited once. Posters: `bun frontend/scripts/capture-posters.ts <base>
[ids]` captures every animated step from `/manufacturing#step=<id>`.

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
| MCP (metals) | `get_metal_supply(element, stage?)`, `get_metal_prices(series, from?, to?)` |
| REST (metals) | `GET /api/v1/metals`, `GET /api/v1/metals/{element}`, `GET /api/v1/metal-prices/{series}` |
| MCP (policy) | `list_policy_measures(jurisdiction?, type?, stage?, status?)` |
| REST (policy) | `GET /api/v1/policy`, `GET /api/v1/policy/{id}`, Atom feed `/policy/feed.xml` |
| MCP (processes) | `get_process(chain?, step?)` |
| REST (processes) | `GET /api/v1/processes`, `GET /api/v1/processes/{chain}?step=` |
| MCP (countries) | `get_country(code)` |
| REST (countries) | `GET /api/v1/countries`, `GET /api/v1/countries/{code}` |

Commodity prices for any page come from `priceAt(seriesId, "YYYY-MM")` in
`src/supply-chain/metals/prices.ts`: the last reading in that month, else the
year's annual average, else the last earlier point with `carried: true`.

Government measures (export controls, tariffs, subsidies, standards) live once
in `src/supply-chain/policy/`: `/policy` draws them, `/metals` pins the ones
with a `metals` link on its price chart, and the country pages (#79) are to
read their strip from `measuresForCountry(code)`. Each measure needs a government or
standards-body source and a dated, sourced `statusHistory`, oldest first.

Every number in a response carries `as_of`, `confidence`, `note` and the full
source references.

## Adding a country

Country pages (`/japan` and `/korea` are live; `/china` and `/us` are planned)
share one template, so a new country is data only:

```
 /<country>  (CountryPage.tsx + countryBody(), both generic)
     |
     +-- src/supply-chain/country-pages/<country>.ts  lede, stage shares, clusters
     +-- companies registry  (hqCountry == code, or a site in code)
     +-- sites registry      (site.country == code, any owner)
     +-- supply links        (current links touching those companies)
     +-- policies            (measuresForCountry(code) from /policy)
     +-- world shares        (STAGE_SHARES.nd for the concentration badge)
```

1. **Content.** Copy `src/supply-chain/country-pages/japan.ts` to
   `<country>.ts` and register it in `CONTENT` in
   `src/supply-chain/country-pages/index.ts`. Write a one-sentence `lede`,
   one `stages` entry per stage you can source (a `share` as a
   `Sourced<number>` fraction of world output, or a `gap` with its sources
   when no source splits the stage by country) and the named `clusters`
   (`[minLat, minLon, maxLat, maxLon]`, each with a one-line `blurb`; the
   tests require each box inside the country and holding at least two
   sites).
2. **Companies.** Add a `companies/<country>.ts` list, typed from
   `companies/types.ts`, and spread it at the end of `COMPANIES`. Revenue is
   the latest fiscal year in USD with the conversion rate in `note`
   (`yenRevenue` in `companies/japan.ts` is the pattern); gross margin is
   gross profit over net sales from the same fiscal year as the revenue
   (the tests check the two `asOf` values match), computed here and so
   marked `modeled`, with the inputs and their source in `note`
   (`grossMargin` is the pattern). When a source gives only one year, cite
   a second source for the other figure rather than mixing years. A
   `stages` share must be the country's share; a single company's market
   share goes in a `gap` with that context. Add a brand row in
   `src/brands/index.ts` for every new company name.
3. **Sites.** Add `sites/<country>.ts` (headquarters, `hq()`) and plants
   (`plant()` from `sites/types.ts`) and spread them at the end of `SITES`.
   Set `precision` honestly: `site` for the gate, `city` for the city
   centre, `region` when only the prefecture, province or state is public.
   A plant owned from abroad goes in the host country's file and shows on
   that map with an owner chip.
4. **Links.** Append supply links (seller first) with sources; the
   partner abroad needs a company and a site so the arc has an anchor.
5. **Sources.** Put the country's sources in
   `country-pages/<country>-sources.ts` and spread them at the end of
   `SOURCES`; every one needs a `reuse` value.
6. **Gate.** The page goes live (route, header menu, footer, sitemap,
   llms.txt, `/api/v1/countries`, `get_country`, and arc chips on other
   maps turning into links) once `coverage(code)` reaches
   `COVERAGE_TARGET`: 40 companies, 80 sites and 30 current links, of which at
   least 15 are supply (parts or materials). Tag a money link
   `kind: "investment"` and a research or integration tie
   `kind: "partnership"`; untagged links are supply. Until
   then nothing is routed, so the data can merge in steps. When a country's
   data issue sets a lower bar, put it in the page's `gate` field
   (`/korea` uses 30 companies, 50 sites and 20 links, 10 of them supply).
7. **Check.** `make citation_audit`, `bun test tests/supply-chain` and
   `bun test tests/server/country.test.ts`; update the page count in
   `tests/server/short-titles-golden.ts` and the live-page list in
   `frontend/tests/supply-chain-kit.test.tsx`, and recapture the mount
   fixtures (`bun frontend/tests/capture-seo-pages.ts`,
   `bun frontend/tests/capture-comparisons.ts`) since the header menu
   changes.

Shared components the template uses, reusable on any map page:
`<CompanyDrawer>` (company card in a `MapDrawer`: HQ, plants, products,
role, revenue, gross margin, ownership, supply links),
`<SiteDetail>` (what a plant makes, capacity, year opened, status, pin
precision, source) and `<CompanyTable>` (sortable, row click selects), all
in `frontend/src/components/supply-chain/`. URL state is `?segment=`,
`?company=`, `?site=` and `?cluster=`.
