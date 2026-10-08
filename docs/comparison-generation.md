# Catalog-driven comparison pages

## One policy, several surfaces

`src/catalog/comparison-registry.ts` is dependency-neutral: it accepts catalog records and imports only the existing display-only gearbox policy. It does not import React, server code, package dependencies, or a second catalog. The canonical data remains `frontend/src/data/actuators.json`.

`comparisonDirectory(ACTUATORS)` drives the server hub, React hub, generated Page registry, reversed-URL resolution and product/related comparison navigation. `allPages()` supplies the sitemap and `findPage()` supplies actual HTML/Markdown routes. Templates use the existing `COMPARE_SPECS`, `revisionNote` and exact engineering source locators; they do not revalidate catalog values.

## Adding an actuator

Add the exact SKU/revision to the existing catalog with its ordinary sources and photo. No pair list, route, sitemap or frontend configuration needs editing. On the next application build/start, the registry is recomputed and eligible relevant comparisons appear automatically. Preserve voltage, winding/KV, revisions and gear ratios in the model name. Do not add guessed fields just to make a model eligible.

Selection rules:

- A unique, unambiguous lowercase slug ID; duplicates are excluded rather than choosing one record by input order. IDs containing the reserved `-vs-` delimiter cannot form generated URLs.
- At least three positive finite mechanical values among peak torque, rated torque, maximum speed and mass, including at least one torque value.
- Existing bare-gearbox exclusions apply. Names identifying a family, series, controller or driver are excluded generically. A standalone frameless motor can qualify; a torque-less driver cannot. Sparse families remain browsable in the catalog and arbitrary selection tool, not in generated pages.
- Peers must share the same drive category and at least three qualifying numeric fields. Zero and null are never substituted for missing data or used to infer similarity. A valid selected comparison still displays real zero values through the existing display adapter.
- Each model proposes up to three nearest peers. Distance is the mean absolute difference divided by the larger value for each shared field. Ties break by ID; unordered pair IDs and final paths are sorted deterministically.
- The union of proposals produces at most three times the number of eligible models in generated pages, rather than all possible combinations. Incoming proposals can give a model more than three related links. Requests for a larger policy cap are clamped to three; zero disables generation.

Similarity is a **discoverability heuristic**, not proof of engineering compatibility, matched-condition performance or an actuator recommendation. Category labels themselves are catalog groupings, not interchangeable component boundaries. Confirm voltage, packaging, control interface, duty and installed revision independently.

## Bounded URL lifecycle

Deterministic means identical catalogs produce identical pairs regardless of input order; it does **not** mean insertion-stable URLs. Adding or changing a model can displace an older nearest-peer proposal. The regression cloning RMD-X8-120 as `aaa-new-exact-sku` intentionally retires the X10-S2-V3/Steadywin GIM6010-36 and X8-120/RobStride 03 pairs. This tradeoff keeps generation bounded instead of accumulating every historical combination. Retired generated URLs currently return 404; no permanent-URL promise is made. The authored dossier is explicitly retained while its model references remain valid.

Before each catalog release, diff the old and new path sets and review displaced URLs. Before first publication there are no indexed generated pages to migrate. If later indexing or inbound links warrant retirement handling, propose a separately reviewed, bounded retirement manifest (fixed budget/expiry, explicit relevant replacement or 410); do not silently redirect unrelated pairs or retain an unbounded historical graph. No retirement manifest or permanent routing guarantee is implemented here.

## Authored evidence overrides

The existing AK80-9 V3.0 KV100 versus original CyberGear dossier remains authored and unchanged. `AUTHORED_COMPARISONS` reserves its canonical pair as a documented preservation exception even if nearest-peer selection does not propose it. The server filters authored Page paths out of generated templates, so there is only one URL and one body.

When exact-revision evidence deserves an authored comparison, register the Page in `EDITORIAL_PAGES` and its discoverable pair identity in `AUTHORED_COMPARISONS`. This is editorial routing metadata, not a manually maintained generated pair list. Retain source qualifications, unknowns and document conflicts; never replace an authored dossier with template arithmetic. Add an override regression for the authored URL and its reversed Markdown/HTML redirects.

## URLs and indexing boundaries

- `/compare` is the indexable comparison directory. Native category links and pair links work before JavaScript; the React empty state retains them after startup.
- `/compare?compare=...` retains arbitrary validated 2–4 selections and silent history restoration. These URLs use the hub canonical and `noindex, follow`, not generated sitemap entries.
- `/comparisons/<sorted-id>-vs-<sorted-id>` is a static server-rendered page with the exact models, product photos, source links, evidence-aware specification table and catalog subtraction contrasts. Subtraction is explicitly labeled arithmetic, not a measured advantage or winner.
- Each pair has a `.md` twin and `Accept: text/markdown` response, its own canonical/metadata, WebPage JSON-LD and breadcrumbs. No fabricated ratings, reviews or schema-validation claims are emitted.
- Reversed registered HTML and Markdown URLs redirect with HTTP 301 to the corresponding sorted canonical, preserving query parameters. Unknown, self, cross-category or unselected/noneligible pair routes return true 404s.

## Verification and fixture maintenance

Run from the repository root:

```sh
bun test tests/catalog/comparison-registry.test.ts tests/server/generated-comparisons.test.ts tests/server/compare-engineering-sources.test.ts
bun frontend/tests/capture-comparisons.ts
cd frontend && bun test tests/comparison-hub.test.tsx tests/compare-order.test.tsx tests/pick-compare.test.tsx
```

Registry tests cover synthetic catalog additions, reversed catalog ordering, duplicate and ambiguous IDs, self exclusion, null/zero/nonfinite values, families/controllers, pairwise shared fields and deterministic caps/ties. HTTP tests enumerate the entire directory and check unique exact-model metadata/body, canonical heads, Markdown negotiation, one sitemap entry per pair, reverse redirects and every rendered native internal link. They also verify checked-in real server captures against fresh HTTP output. Frontend tests mount the actual startup route over those captures and check silent restoration and persistent directory discovery.

The existing catalog/title goldens are not regenerated: generated pages are excluded by their actual registered paths, and only the exact new product navigation section is reversibly normalized. Original catalog bytes, original product metadata/specification content hashes and the authored dossier remain protected. When captures intentionally change, regenerate only `fixtures/comparisons.json` with the script above.

The frontend imports the registry and shared CSS from root `src/`; keep both in Docker's build-stage COPY inputs. A full-checkout build is not deployment verification. Before publishing, independently review the patch, run frontend-only isolated dependency installation/tests, then build and smoke the actual production container and review desktop/mobile photos, native disclosure/fragment behavior and selection history in a real browser. No production changes are part of local verification.
