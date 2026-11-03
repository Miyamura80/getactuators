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

## Benchmark submissions

Measured an actuator on a dyno or bench? Add the run so it shows on the `/benchmarks` page (actuatorlist.com/benchmarks) next to the datasheet, badged **community**.

1.  Measure to the [test protocol](docs/benchmarks/protocol.md): rig requirements, procedures, minimum samples and how to report uncertainty. The torque-speed and thermal groups are required; backlash, stiffness, friction, ripple, bandwidth, latency and repeatability are optional.
2.  Add one folder `data/benchmarks/<actuator-id>/<run-id>/`, where `<actuator-id>` is the catalog id from the actuator's URL (`/actuators/<actuator-id>`). Put in it:
    *   `run.json`: the run in the schema of `src/benchmarks/types.ts` (`BenchmarkRun`), with `"origin": "community"`, `"dataMethod": "raw"` and `"submitter"` set to your GitHub handle.
    *   `torque-speed.csv` (`rpm,torque_nm,efficiency`) and `thermal.csv` (`torque_nm,t_to_limit_s,winding_rise_c`): the raw readings behind the summary points in `run.json`.
    *   `rig.md`: the rig in a few lines (sensor, coupling, load, cooling, controller and firmware).
    *   At least one rig photo named `rig.jpg`, `rig.png` or `rig.webp` (or `rig-<anything>` with one of `.jpg`, `.jpeg`, `.png` or `.webp`).
3.  Regenerate the run index and check the folder:
    ```bash
    bun run scripts/validate-benchmarks.ts --write
    make fmt
    make validate_benchmarks
    ```
    The validator checks the schema and units, that the actuator exists, that both core groups have their minimum samples, that the CSVs agree with `run.json`, that every metric has an uncertainty, that the T-N envelope never rises with speed by more than the torque-speed uncertainty, and that the highest torque is within 0.3x to 1.5x the datasheet peak (explain a real outlier in `plausibilityNote`).
4.  Open the pull request and tick the benchmark box in the template. A maintainer reviews the rig and the data before merging.

Adding a published test instead (paper, thesis, vendor report, blog or video)? Use `"origin": "published"` with `source: {url, title}` and a `sourceKind` (`paper`, `thesis`, `vendor`, `blog` or `video`; a maker's own measurement is `vendor` wherever it is posted), add the source to `src/benchmarks/sources.ts` with a `reuse` value, and set `dataMethod` to `"tabulated"`, `"digitised"` (read off a plot, with the reading error as the uncertainty) or `"reported"` (figures quoted in the text), explaining how in `methodNote`. Published runs need no CSVs, `rig.md` or photo, and never use `"raw"`. When the source states no uncertainty, say in `methodNote` what the value you entered is based on.

## Pull Requests

*   Keep PRs focused on a single change.
*   Update documentation if necessary.
