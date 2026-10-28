# Benchmark test protocol

How to measure an actuator so the run can be published on
[/benchmarks](https://actuatorlist.com/benchmarks) next to the datasheet. A run
is one folder, `data/benchmarks/<actuator-id>/<run-id>/`, checked by
`scripts/validate-benchmarks.ts` in `make ci`. See
[CONTRIBUTING.md](../../CONTRIBUTING.md#benchmark-submissions) for the pull
request steps.

## Origins

| Origin | Who | What the validator requires |
|--------|-----|-----------------------------|
| `published` | A paper, thesis, vendor test report, blog or video someone else published | `source.url` and `source.title`; at least one measurement; `method` is `reported` (numbers from the source's text or tables) or `digitised` (read off a plot, with an uncertainty per channel) |
| `lab` | A test run by the maintainers | Everything below, `method: "raw"` |
| `community` | Anyone, by pull request | Everything below, `method: "raw"`, plus `submitter` (GitHub handle) |

A digitised curve is never raw data. Say how it was digitised in `notes` and
give its uncertainty.

## Rig requirements (lab and community)

| Item | Minimum |
|------|---------|
| Torque transducer | Inline rotary or reaction sensor, accuracy class 0.5% of full scale or better, full scale no more than 3x the actuator's peak torque |
| Output position | External output encoder of 17 bit or better for backlash, stiffness and repeatability; the actuator's own encoder does not count |
| Load | Absorber (second motor, brake or dynamometer) able to hold the actuator at stall and drive it at constant speed |
| Ambient | 20 to 25 C, still air, recorded; no fan or heatsink unless stated in `rig.md` |
| Supply | Bench supply at the stated bus voltage, droop under 2% at peak current |
| Temperature | Winding thermocouple or the driver's winding sensor, named in `rig.md` |

Every `rig` field must be filled: `torqueSensor`, `accuracyPct`, `encoder`,
`ambientC`, `busV`, `controller` and, when known, `firmware`.

## Procedures

### Torque-speed (core)

1. Mount the actuator on the rig at the stated bus voltage, driver current
   limit at the datasheet peak.
2. Stall point: hold the output at 0 rpm and command peak current for at most
   1 s. Record torque. This is `{ "rpm": 0, "torqueNm": ... }`.
3. Step the absorber through at least 5 speeds from 0 to no-load, recording the
   maximum sustained torque at each speed (1 s window). Record efficiency
   (mechanical output over electrical input at the bus) when the electrical
   input is measured.
4. No-load point: unloaded speed at full command, `torqueNm: 0`.
5. Let the actuator cool to within 5 C of ambient between points.

The envelope must not rise with speed beyond the stated torque uncertainty
(2% slack); efficiency must be at most 1.

### Thermal (core)

1. Start from ambient (winding within 2 C of ambient).
2. Hold a constant torque at stall until the driver derates or the winding
   reaches its rated limit. Record `tToLimitS` and the winding rise
   `windingRiseC` above ambient.
3. Repeat for at least one torque; three or more give a derating curve.
4. A torque held 30 minutes without reaching the limit is continuous: record
   `tToLimitS: null`. This is the number the measured leaderboard ranks.

A higher torque must not be held longer than a lower one.

### Transmission quality (optional)

- Backlash: lock the input (motor at zero speed, position control), apply
  plus and minus 5% of rated torque at the output, record the dead band in
  arcmin from the external encoder. Report unloaded and loaded figures in
  `notes` if both are measured; store the unloaded one.
- Torsional stiffness: lock the motor, ramp output torque to rated in both
  directions, fit the slope between 20% and 100% of rated, Nm/rad.
- Friction or backdrive torque: driver off, rotate the output at 10 rpm, mean
  torque in Nm.
- Torque ripple: constant command at 50% of rated, slow rotation, peak to peak
  over mean in percent.

### Control performance (optional)

- Torque or position bandwidth: chirp at 10% of rated amplitude, -3 dB point in
  Hz.
- Command to response latency over CAN or EtherCAT: timestamp the bus frame
  and the first measurable torque change, median of at least 100 commands, ms.
- Repeatability: approach a target 30 times from alternating directions,
  spread (2 sigma) at the output encoder in arcmin.

## Sample counts and uncertainty

- At least 3 repeats per thermal point and per scalar metric; report the mean.
- `uncertainty` holds one expanded uncertainty (k = 2) per reported channel,
  in the channel's own unit: `torqueNm`, `rpm`, `efficiency`, `tToLimitS`,
  `windingRiseC`, and each scalar metric you report (for example
  `backlashArcmin`).
- Combine the transducer accuracy class, encoder resolution and repeat spread.

## Plausibility checks

The validator rejects a measured peak torque below 0.3x or above 1.5x the
catalog datasheet value unless the run carries a `plausibilityNote` that says
why (for example, a different bus voltage). A maintainer reads every note
before merging.

## Folder layout

```text
data/benchmarks/<actuator-id>/<run-id>/
  run.json        the run, schema below
  rig.md          rig description: sensors, mounting, cooling, photos list
  *.csv           raw logs (time, command, torque, speed, temperature, bus V and A)
  *.jpg / *.png   rig photos (optional, keep each under 500 KB)
```

`<actuator-id>` is the catalog id (the slug in `/actuators/<id>`). `<run-id>` is
lowercase words joined by hyphens, unique for that actuator.

## run.json

```ts
interface BenchmarkRun {
    actuatorId: string;            // must exist in the catalog
    runId: string;                 // same as the folder name
    date: string;                  // YYYY, YYYY-MM or YYYY-MM-DD
    origin: "published" | "lab" | "community";
    method: "reported" | "digitised" | "raw";
    source?: { url: string; title: string; locator?: string }; // required for published
    submitter?: string;            // GitHub handle, community only
    unit: string;                  // hardware revision and setup tested
    rig: {
        torqueSensor: string | null; accuracyPct: number | null;
        encoder: string | null; ambientC: number | null;
        busV: number | null; controller: string | null; firmware?: string;
    };
    torqueSpeed?: { rpm: number; torqueNm: number; efficiency?: number }[];
    thermal?: { torqueNm: number; tToLimitS: number | null; windingRiseC?: number }[];
    backlashArcmin?: number; stiffnessNmPerRad?: number; frictionNm?: number;
    ripplePct?: number; bandwidthHz?: number; latencyMs?: number;
    repeatabilityArcmin?: number;
    uncertainty: Record<string, number>;  // per reported channel
    claims?: { metric: string; value: number; source: string }[]; // datasheet values not in the catalog
    plausibilityNote?: string;
    notes?: string;
}
```

Unknown fields are rejected, so a typo in a unit name fails the check.
