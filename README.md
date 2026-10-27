# actuatorlist

<p align="center">
  <img src="media/banner.png" alt="actuatorlist" width="400">
</p>

<p align="center">
<b>A community directory of actuators for robotics and motion systems</b>
</p>

<p align="center">
  <a href="#what-is-actuatorlist">What is it</a> •
  <a href="#whats-in-the-catalog">Catalog</a> •
  <a href="#for-ai-agents">For agents</a> •
  <a href="#contributing-data">Contributing data</a> •
  <a href="#development">Development</a> •
  <a href="#credits-and-license">Credits</a>
</p>

<p align="center">
  <img alt="Project Version" src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FMiyamura80%2Fgetactuators%2Fmain%2Fpackage.json&query=%24.version&label=version&color=blue">
  <img alt="Bun" src="https://img.shields.io/badge/runtime-bun-f9f1e1?logo=bun">
  <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/Miyamura80/getactuators">
  <img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/Miyamura80/getactuators/ci_checks.yaml?branch=main">
</p>

---

## What is actuatorlist

[actuatorlist](https://actuatorlist.com) is a free, open directory of robot
actuators. It puts the numbers that decide a joint design (peak and rated
torque, weight, torque density, backlash, speed, price) side by side, so a
builder can compare parts without re-reading the same datasheets for every
project.

Every entry links the manufacturer pages, datasheets or retailer listings it
was built from. The site carries no advertising or sponsored placements, and
rankings are computed from the published numbers.

## What's in the catalog

The catalog covers 60+ rotary joint actuators from about 30 brands, plus a
dozen reference robots (humanoids and robot arms) with the motor used in each
joint. Linear and fluid-power actuators are out of scope for now.

| Category | What it covers |
|----------|----------------|
| QDD / Proprioceptive | Quasi-direct-drive motors with low gear ratios; backdrivable, used in legged robots |
| Integrated Joint | Motor, gearbox, encoder and driver in one housing, sized for arm and humanoid joints |
| Smart Servo | Compact bus servos with onboard control, common in hobby and research arms |
| Harmonic / Precision | Strain-wave gearing with near-zero backlash for precise positioning |
| Frameless + Driver | Frameless motor kits and standalone drivers for custom actuator builds |
| Cycloidal / Premium | Cycloidal and RV reducers for high-torque, shock-tolerant joints |

The site also has side-by-side comparisons, a humanoid joint sizing guide and
an arm holding-torque calculator. The data lives in
`frontend/src/data/actuators.json` and `frontend/src/data/robots.json`; the
field reference is [docs/catalog-schema.md](docs/catalog-schema.md).

## For AI agents

The live catalog is free, anonymous and read-only for agents as well as
people. No key or account is needed.

| Surface | URL |
|---------|-----|
| llms.txt index (start here) | `https://actuatorlist.com/llms.txt` |
| Whole catalog as text | `https://actuatorlist.com/llms-full.txt` |
| MCP server (Streamable HTTP) | `https://actuatorlist.com/mcp` |
| REST API + OpenAPI | `https://actuatorlist.com/api`, `https://actuatorlist.com/openapi.json` |
| Agent guide | `https://actuatorlist.com/agents.md` |
| Agent skill | `https://actuatorlist.com/.well-known/agent-skills/actuatorlist/SKILL.md` (source: [skills/actuatorlist/SKILL.md](skills/actuatorlist/SKILL.md)) |
| Discovery catalogs | `/.well-known/ard.json`, `/.well-known/api-catalog`, `/.well-known/agent-card.json` |

Every page also has a markdown twin: append `.md` to its URL or send
`Accept: text/markdown`.

To add the MCP server to a client:

```bash
# Claude Code
claude mcp add --transport http actuatorlist https://actuatorlist.com/mcp
```

```json
// Cursor (~/.cursor/mcp.json); Windsurf uses "serverUrl" instead of "url"
{ "mcpServers": { "actuatorlist": { "url": "https://actuatorlist.com/mcp" } } }
```

| Tool | Answers |
|------|---------|
| `recommend_actuators` | Ranked picks for a job (use case, torque, mass, budget) with reasons |
| `search_actuators` | Filter and sort by category, brand, use case, torque, mass, price |
| `get_actuator` / `compare_actuators` | Full specs; 2-10 units side by side |
| `list_actuator_categories` / `list_brands` | Valid filter values with counts |
| `list_robots` / `get_robot` / `find_robots_using_actuator` | Robots and the motor in each joint |
| `humanoid_joint_requirements` | Static torque per humanoid joint (pose and arithmetic shown) with matching actuators |
| `arm_holding_torque` | Holding torque per arm joint from links, masses and payload |

Resources: `catalog://actuators`, `catalog://robots`, `catalog://categories`,
`actuator://{id}`, `robot://{id}`. A second MCP server at `/mcp/docs` serves
the reference docs. Registry metadata is in [server.json](server.json) and
[smithery.yaml](smithery.yaml).

## Contributing data

**Report wrong data or suggest an actuator.** Open an issue in this
repository's GitHub issue tracker with the actuator name, the field that is wrong or missing, and a link to the
manufacturer page or datasheet that shows the right value. Sources matter more
than anything else.

**Verified vs unverified.** Entries marked verified have been spot-checked
against their cited sources. The rest are labelled unverified until someone
checks them. Rankings on the home page use verified entries only; every entry
still appears in tables, the gallery and the API.

**Add or fix an entry yourself.**

1. Fork the repo and create a branch.
2. Edit `frontend/src/data/actuators.json` following
   [docs/catalog-schema.md](docs/catalog-schema.md). Use primary sources, fill
   `sources`, and use `null` for anything unknown. Never guess a number.
3. Keep the derived fields (`torque_density_nm_per_kg`, `price_per_nm`,
   `data_source`) in step with their inputs. `make validate_data` reports
   dataset problems and `make test` fails if derived fields drift.
4. Run `make ci` and open a pull request. `main` is protected and changes land
   by squash-merge.

Security issues go through a private GitHub Security Advisory; see
[SECURITY.md](SECURITY.md). General code contributions follow
[CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Requires [Bun](https://bun.sh).

```bash
make setup                        # install root dependencies
bun add -g prek && prek install   # enable the git hooks in prek.toml

# Run the site locally: build the frontend, then start the Bun server
cd frontend && bun install && bun run build && cd ..
bun run scripts/serve_frontend.ts # serves frontend/dist and agent routes on :3000

# Frontend dev server only (Vite)
cd frontend && bun run dev
```

Company logos use Logo.dev when `VITE_LOGO_DEV_TOKEN` is set in
`frontend/.env` (or as a Railway variable); without a token, logos without a
self-hosted image render as monograms. See [docs/brand-logos.md](docs/brand-logos.md).

Main make targets:

| Target | What it does |
|--------|--------------|
| `make test` | Run all tests (`bun test`) |
| `make test_fast` | Tests with a 5s timeout |
| `make fmt` / `make lint` | Format or check with Biome |
| `make typecheck` | `tsc --noEmit` |
| `make deadcode` | Unused code and dependencies (knip) |
| `make lint_links` | Check links in markdown files |
| `make validate_data` | Report problems in the actuator and robot datasets |
| `make ci` | All CI checks; must pass before committing |

### Repo layout

```
getactuators/
+-- src/
|   +-- catalog/      Catalog loading, queries, rankings, evidence
|   +-- api/          REST API handlers and OpenAPI document
|   +-- mcp/          MCP servers (catalog and docs)
|   +-- engineering/  Torque calculators
|   +-- server/       Bun server: routes/ (auto-discovered) and agent/ (markdown,
|   |                 llms.txt, JSON-LD and /.well-known builders)
|   +-- config/       YAML + env config
+-- frontend/         Vite + React site; data in frontend/src/data/
+-- skills/           Public agent skill served under /.well-known
+-- scripts/          Server entrypoint, image fetching, data validation, CI checks
+-- tests/            Bun test suites (server, data, catalog, scripts)
+-- docs/             Catalog schema and internal notes
```

### Product images

Photos are self-hosted under `frontend/public/`. The
[Fetch Actuator Images](.github/workflows/fetch-actuator-images.yaml) workflow
runs on a GitHub-hosted runner: it crawls each actuator's cited page for a
product photo, optimizes it, downloads each robot's listed photo, and commits
the images and updated datasets back to the branch. Trigger it from the
Actions tab, or on any branch by touching `.github/fetch-images.trigger` and
pushing. Locally, `bun run images:sync` runs the actuator fetch and optimize
steps.

## Credits and license

- Robot joint data (which motor sits in each joint) is credited to Reece
  O'Mahoney of [UnitZero](https://unitzero.ai).
- Built with [Bun](https://bun.sh), [Biome](https://biomejs.dev),
  [Zod](https://zod.dev), [prek](https://github.com/j178/prek) and
  [Vite](https://vitejs.dev).

- **Code**: [MIT License](LICENSE).
- **Data** (the actuator, robot, humanoid and supply-chain catalog): [CC BY 4.0](LICENSE-DATA).
  Credit "actuatorlist.com (Eito Miyamura)". Product photos, logos and
  headshots are not covered; they belong to their owners and are shown for
  identification only. Third-party figures keep their source citations.
