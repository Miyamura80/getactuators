# Scripts

Utility and initialization scripts for the actuatorlist project.

## Asset Generation

One-time scripts for generating brand assets using the Gemini AI image generation API.

### Prerequisites

Set `GEMINI_API_KEY` in your `.env` file:

```
GEMINI_API_KEY=AIza...
```

### generate-banner.ts

Generates a banner image using LLM-powered description generation and Gemini image generation.

**Usage:**

```bash
# Using Makefile
make banner

# Direct (with optional title and suggestion args)
bun run scripts/generate-banner.ts
bun run scripts/generate-banner.ts "My-Project" "use a rabbit in the image"
```

**Output:**

- `media/banner.png` - Wide horizontal banner (16:9 aspect ratio, sumi-e ink wash style)

### generate-logo.ts

Generates a full logo suite (wordmark, icons, favicon) using a multi-step AI pipeline with greenscreen compositing.

**Usage:**

```bash
# Using Makefile
make logo

# Direct (with optional project name and suggestion args)
bun run scripts/generate-logo.ts
bun run scripts/generate-logo.ts "My-Project" "modern geometric style"
```

**Output (saved to `frontend/public/`):**

- `logo-light.png` - Horizontal wordmark for light mode
- `logo-dark.png` - Horizontal wordmark for dark mode
- `icon-light.png` - Icon only, 512x512, for light mode
- `icon-dark.png` - Icon only, 512x512, for dark mode
- `favicon.ico` - Favicon (32x32, ICO format)

**Pipeline:**

1. Generate creative wordmark description via Gemini text model
2. Generate light mode wordmark with greenscreen background
3. Extract icon from wordmark (AI removes text, keeps icon)
4. Remove greenscreen from both assets (pixel-level alpha manipulation)
5. Invert colors for dark mode variants
6. Resize icons and create favicon

### Dependencies

- `@google/genai` - Gemini API client
- `sharp` - Image processing (resize, pixel manipulation)
- `to-ico` - ICO file format conversion

## Other Scripts

- **check_ai_writing.ts** - Checks for em dashes in the codebase (AI writing detector)
- **validate-agents-md.ts** - Validates CLAUDE.md/AGENTS.md has required sections

## Price snapshots (`price-snapshot/`)

Records each catalog actuator's listed price into `data/prices/history.json`,
which `/prices`, its `.md` twin, `GET /api/v1/prices/{actuatorId}` and the MCP
tool `get_price_history` read. Each point keeps its method, source URL, listed
currency and the day's ECB rate to USD. Out-of-stock is a flag, not a price.

Extractors, most reliable first: Shopify product JSON, WooCommerce Store API,
schema.org `Product`/`Offer` JSON-LD, then CSS selectors. The bot sends a
User-Agent pointing at this repo, honours robots.txt and waits 3 s between
requests to one host.

```bash
# This week's prices (the weekly workflow runs this and opens a PR)
bun run scripts/price-snapshot/snapshot.ts --report /tmp/price-report.md

# One-off Internet Archive back-fill, at most one snapshot per month
bun run scripts/price-snapshot/wayback.ts --since 2022 --report /tmp/wayback.md

# Seed from the catalog's own git history (needs a full clone)
bun run scripts/price-snapshot/seed-catalog.ts
```

All three take `--dry-run`; snapshot and wayback also take `--only id1,id2`. The workflow is
`.github/workflows/price-snapshot.yaml` (weekly, or by hand with mode
`wayback`); it never pushes to `main`.
