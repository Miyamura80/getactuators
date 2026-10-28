# Contributing

## Getting Started

1.  **Prerequisites**:
    *   Bun >= 1.0
    *   Node.js >= 18 (for some tooling)

2.  **Setup**:
    ```bash
    make setup
    ```

3.  **Run Tests**:
    ```bash
    make test
    ```

## Development Workflow

1.  Create a new branch for your feature/fix.
2.  Make your changes.
3.  Ensure code quality commands pass:
    ```bash
    make ci
    ```
    This runs linting, dead code detection, type checking, tech debt checks, duplicate code detection, import boundary checks, and link linting.

## Code Style

*   Follow the existing conventions (camelCase for functions/variables, PascalCase for classes/types, kebab-case for file names).
*   Use Biome for linting and formatting (handled by `make fmt` and `make lint`).
*   4-space indentation, double quotes.
*   Add tests for new features.

## Pull Requests

*   Keep PRs focused on a single change.
*   Update documentation if necessary.

## Benchmark submissions

Measured an actuator on a dynamometer? Add the run to
[/benchmarks](https://actuatorlist.com/benchmarks) by pull request.

1.  Follow the [test protocol](docs/benchmarks/protocol.md): rig requirements,
    procedures, sample counts and how to state uncertainty.
2.  Add one folder per run: `data/benchmarks/<actuator-id>/<run-id>/` with
    `run.json`, `rig.md` and your raw CSV logs. Use `"origin": "community"`,
    `"method": "raw"` and your GitHub handle as `submitter`. The actuator must
    already be in the catalog.
3.  Check and bundle it:
    ```bash
    bun run scripts/validate-benchmarks.ts --write
    make ci
    ```
    The validator checks the schema and units, that the actuator exists, that
    the core torque-speed and thermal measurements are present, and that the
    numbers are plausible (peak torque within 0.3x to 1.5x the datasheet unless
    you add a `plausibilityNote`, efficiency at most 1, a torque-speed envelope
    that does not rise with speed).
4.  Open the pull request and tick the benchmark box in the template. A
    maintainer reviews the rig and the raw logs before the run goes live with a
    **community** badge.

Published measurements (papers, vendor test reports, reviewer teardowns) are
welcome too: use `"origin": "published"`, link the source and quote where in it
the numbers are. Never present numbers read off a plot as raw data; use
`"method": "digitised"` with an uncertainty.
