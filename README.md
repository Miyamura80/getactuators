# getactuators

<p align="center">
  <img src="media/banner.png" alt="Getactuators" width="400">
</p>

<p align="center">
<b>A community directory of actuators for robotics and motion systems</b>
</p>

<p align="center">
  <a href="#what-is-getactuators">What is it</a> •
  <a href="#actuator-categories">Categories</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#project-layout">Project Layout</a> •
  <a href="#contributing-an-actuator">Contributing</a> •
  <a href="#credits">Credits</a>
</p>

<p align="center">
  <img alt="Project Version" src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FMiyamura80%2Fgetactuators%2Fmain%2Fpackage.json&query=%24.version&label=version&color=blue">
  <img alt="Bun" src="https://img.shields.io/badge/runtime-bun-f9f1e1?logo=bun">
  <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/Miyamura80/getactuators">
  <img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/Miyamura80/getactuators/ci_checks.yaml?branch=main">
</p>

---

## What is getactuators

getactuators is a searchable directory of actuators used in robotics and motion
control. Each entry captures the details an engineer needs to compare parts
quickly: actuator type, drive method, key specs (torque, speed, stroke, force,
voltage), form factor, and where to source it.

The goal is a single, well-structured catalog you can browse by category and
filter by the specs that matter for a build, instead of scattering the same
research across datasheets and spreadsheets every time.

## Actuator categories

| Category | Examples | Typical use |
|----------|----------|-------------|
| **Rotary electric** | Servo, stepper, BLDC, brushed DC, gearmotor | Joints, wheels, pan/tilt |
| **Linear electric** | Lead-screw, ball-screw, linear servo, solenoid | Slides, presses, valves |
| **Fluid power** | Hydraulic cylinder, pneumatic cylinder, rotary vane | High-force lifting, clamping |
| **Compliant / soft** | Series-elastic, pneumatic muscle, shape-memory alloy | Safe contact, wearables |
| **Specialty** | Piezo, voice-coil, harmonic drive | Precision positioning, haptics |

Each catalog entry records the actuator type, drive method, rated specs, form
factor, interface, and sourcing links.

## Quick Start

```bash
# Interactive onboarding (rename, deps, env, hooks, media)
make onboard

# Install dependencies and run the entrypoint
make all

# Format code
make fmt

# Run tests
make test

# Run all CI checks (lint, deadcode, typecheck, and more)
make ci
```

The directory frontend lives in `frontend/` (Vite + React) with its own
dependency tree:

```bash
cd frontend
bun install
bun run dev
```

## Project Layout

```
getactuators/
+-- src/            Core TypeScript (entrypoint: src/index.ts)
|   +-- config/     Zod-validated YAML + env config
+-- tests/          Bun test suites
+-- frontend/       Directory site (Vite + React, separate deps)
+-- scripts/        Utility + asset-generation scripts
+-- media/          Banner and demo assets
```

```
        Contributors
             |
             v
   +---------------------+        +----------------------+
   |   src/ (Bun/TS)     |        |  frontend/ (Vite)    |
   |  catalog + config   | -----> |  browse + filter UI  |
   +---------------------+  data  +----------------------+
             |                             |
             v                             v
       make ci gate                   end users
   (lint, types, deadcode)        (search actuators)
```

## Configuration

Config is loaded from YAML with environment variable overrides:

```typescript
import { globalConfig } from "@/config";

// Access config values from src/config/global-config.yaml
globalConfig.exampleParent.exampleChild;

// Access secrets from .env
globalConfig.openaiApiKey;

// Feature flags (overridable via FEATURES__FLAG_NAME=true)
globalConfig.features.newUi;
```

**Precedence** (highest to lowest):
1. Environment variables (with `__` for nesting, e.g. `DEFAULT_LLM__DEFAULT_MAX_TOKENS=50000`)
2. `.global-config.yaml` (local override, git-ignored)
3. `src/config/production-config.yaml` (if `DEV_ENV=prod`)
4. `src/config/global-config.yaml` (base config)

## Contributing an actuator

1. Fork the repo and create a branch.
2. Add the actuator entry with its type, drive method, specs, form factor, and
   sourcing link.
3. Run `make ci` and make sure it passes with zero errors.
4. Open a PR. `main` is protected, so all changes land through squash-and-merge.

## Credits

- [Bun](https://bun.sh) - JavaScript runtime and package manager
- [Biome](https://biomejs.dev) - Linter and formatter
- [Zod](https://zod.dev) - TypeScript schema validation
- [prek](https://github.com/j178/prek) - Pre-commit hook framework
- [Vite](https://vitejs.dev) - Frontend tooling
