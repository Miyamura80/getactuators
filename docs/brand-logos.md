# Company logos and country flags

Every company name on the site sits next to its logo, and every country is
drawn as its flag. Both go through one shared piece each, so new pages pick
them up instead of adding their own mappings.

## Company logos

```
name or id ──> src/brands (resolveBrand) ──> local logo?  ──yes──> /logos/...
                                                │ no
                                                v
                                        domain + token? ──yes──> img.logo.dev
                                                │ no / 404
                                                v
                                        monogram (initials)
```

- **Registry:** `src/brands/index.ts`. One entry per company: `id`, `name`,
  primary web `domain` (the logo provider's key), optional `aliases` for other
  dataset spellings, optional self-hosted `logo`. `domain: null` is deliberate:
  the site is unverified, so the UI draws a monogram instead of guessing.
  `/startups` rows join automatically from `src/startups.ts` (their `url` gives
  the domain and their `logo` under `frontend/public/logos/startups/` wins over
  the provider).
- **Self-hosted logos:** `src/brands/self-hosted.json` lists 81 official marks
  under `frontend/public/logos/brands/`, each with the page it came from (the
  company's own site, its GitHub org avatar, Wikimedia Commons or simple-icons;
  never a logo API, whose terms forbid storing images). These win over the
  provider, so the site shows real logos with no token. SVGs are sanitized (no
  script, event handlers, foreignObject or external refs); PNGs are at most
  96 px. `"tile": "light"` puts a dark mark on a pale tile. To add one: drop the
  file in that folder and add a row with its `source`; the registry test checks
  the file exists and the id is registered.
- **Lookup:** `resolveBrand("CubeMars (T-Motor)")` matches an id, a name or an
  alias after normalising (case, punctuation, parentheticals), then falls back to
  the catalog's `canonicalBrand`.
- **Test:** `tests/data/brands-registry.test.ts` fails when any dataset names a
  company the registry cannot resolve. Adding a company to a dataset means adding
  a row (with a verified domain, or `null`).

### Using `CompanyLogo`

```tsx
import { CompanyLogo } from "../components/CompanyLogo";

<span className="with-logo">
    <CompanyLogo name={a.brand} size={16} />
    {a.brand}
</span>
```

- `name`: registry id or any spelling the datasets use.
- `size`: 16 inline in tables and lists, 20 on cards and headings.
- `theme`: `"dark"` (default, for the black HUD) or `"light"`.
- `standalone`: set when the name text is *not* beside the logo; the image then
  carries the name as `alt`. Otherwise the logo is decorative (`alt=""`).
- `.with-logo` (in `frontend/src/index.css`) keeps logo and name together with a
  6px gap; on a `<p>` it is a flex row.
- Inside an SVG chart, wrap it in a `<foreignObject>` (see `FundLedger.tsx`).

The tile is a 3px-rounded square on panel black with a faint Graphene Grey
border; images load lazily with explicit width and height, and any load error
falls back to the monogram, so nothing shifts or breaks.

### Logo.dev token

Logos come from the Logo.dev image CDN
(`https://img.logo.dev/{domain}?token=...&size=..&theme=dark&retina=true&fallback=404`),
hotlinked only: never download or commit their images. The URL is built in one
function, `logoUrl()` in `src/brands/index.ts`, so the provider can be swapped
there without touching any page. The token is Logo.dev's publishable key
(`pk_...`), which is safe to expose in the browser; anything else is ignored.

- Local: put `VITE_LOGO_DEV_TOKEN=pk_...` in `frontend/.env` (Vite reads env
  files from `frontend/`), then `cd frontend && bun run build` or
  `cd frontend && bun run dev`.
- Railway: add a `VITE_LOGO_DEV_TOKEN` service variable. The Dockerfile passes
  it into the frontend build as a build arg, so redeploy after setting it.
- Unset: every logo is a monogram.

No page sets a Content-Security-Policy today. If one is added, allow
`img-src https://img.logo.dev`. The MCP compare widget
(`src/mcp/app/compare-view.ts`) has its own CSP and shows no logos.

Server-rendered HTML and the markdown twins stay text only (the humanoid part
rows keep their coloured initials badge), which is the no-JS fallback.

## Country flags

Countries render as flag emoji with the country name as the accessible label
and tooltip. Data files keep storing names; conversion happens at render time.

- `src/country-flag.ts`: `countryFlag("CN")` and `countryName("CN")`, from ISO
  3166-1 alpha-2 codes. Shared with other branches; keep it byte-identical.
- `frontend/src/components/Flag.tsx`: `<Flag code="CN" />` (pass `decorative`
  when the name is already printed beside it).
- `frontend/src/components/CountryFlag.tsx`: `<CountryFlag country="South Korea" />`
  for the dataset's country names, via `countryCode()` in
  `frontend/src/lib/country.ts`.
- Search and filters keep matching on the stored names.
