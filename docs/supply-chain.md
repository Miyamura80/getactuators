# Supply-chain atlas: data and page recipe

The supply-chain pages (`/metals` is live; `/bom`, `/manufacturing`, `/alts`,
`/japan`, `/china`, `/korea`, `/us` are planned; `/lab/supply-chain` is the
hidden kit page) share one cited registry and one set of components.
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
| `<Pins>` | buttons drawn as the segment's object tile (`<SegmentTile>`: a `SEGMENT_COLOR` tile with a `SEGMENT_PICTO` object knocked out: orange pickaxe REE, violet horseshoe magnet magnets/motors, ochre gear gears/screws/bearings, pink robot arm OEM); a hollow dashed tile when `precision !== "site"`; company name beside each; hover or focus shows a monogram card with the site |
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

Commodity prices for any page come from `priceAt(seriesId, "YYYY-MM")` in
`src/supply-chain/metals/prices.ts`: the last reading in that month, else the
year's annual average, else the last earlier point with `carried: true`.

Every number in a response carries `as_of`, `confidence`, `note` and the full
source references.
