# Actuator benchmark test protocol

How to measure an actuator so the run can sit on the `/benchmarks` page (actuatorlist.com/benchmarks) next to its datasheet. Lab and community runs must follow it in full; `scripts/validate-benchmarks.ts` (run by `make ci`) checks every rule marked **checked**. Published runs (papers, vendor reports, blogs) are taken as their source reports them, with the method and uncertainty recorded.

## What a run reports

| Group | Measurements | Required |
| --- | --- | --- |
| Torque-speed | T-N curve at a stated bus voltage, peak torque, no-load speed, efficiency map | Yes (**checked**: the T-N curve only; peak, no-load speed and efficiency are not enforced) |
| Thermal | continuous torque to the thermal limit, time to derate, winding temperature rise, ambient | Yes (**checked**: at least 3 points, each with its winding rise; a continuous point is not enforced) |
| Transmission | backlash, torsional stiffness, backdrive friction, torque ripple | No |
| Control | torque or position bandwidth, command-to-response latency over CAN or EtherCAT, repeatability | No |

Units are fixed by the field names in `src/benchmarks/types.ts`: N·m, rpm, seconds, °C, volts, arcmin, N·m/rad, %, Hz and ms. Efficiency is a fraction from 0 to 1 (**checked**).

## Rig requirements

- **Torque transducer**: an inline rotary or reaction torque sensor between the actuator output and the load, accuracy class 0.5% of full scale or better, with full scale no more than 3x the actuator's datasheet peak. Record its model and accuracy in `rig.torqueSensor` and `rig.accuracyPct` (**checked**: required, and 0.5 or less).
- **Speed and position**: the actuator's output encoder or an external one of at least 14 bits per output turn. Record it in `rig.encoder`.
- **Load**: a second motor in speed control (a dyno) or a brake that can hold any torque up to the actuator's peak. A lever and scale is acceptable for stall torque only.
- **Supply**: a bench supply or battery that holds the stated bus voltage within 2% at peak current. Record the voltage in `rig.busV` (**checked**: required).
- **Ambient**: 20 to 30 °C, still air, measured within 0.5 m of the actuator. Record it in `rig.ambientC` (**checked**: required). Describe any heat sink or fan in `rig.md`; a run on a heat sink is not comparable to one in free air.
- **Controller**: the driver and firmware version in `rig.controller` and `rig.firmware`. Use the maker's current and thermal limits unless the run says otherwise.
- **Photos**: at least one photo of the rig, `rig.jpg`, `rig.png` or `rig.webp` (**checked**), and `rig.md` describing the coupling, load, cooling and controller (**checked**: present with at least 40 non-whitespace characters; what it says is reviewed by a maintainer).

## Procedures

### Torque-speed (T-N curve)

1. Warm the actuator at 20% of rated torque for 5 minutes, then let the winding return within 5 °C of ambient.
2. Hold the load motor at a fixed speed and step the actuator's torque command up until the torque stops rising or a limit trips. Record the highest steady torque held for 1 s.
3. Repeat at speeds from near zero to no-load, at least 5 speeds (**checked**: `torqueSpeed` needs 5 points or more), spaced so the knee of the curve is covered.
4. Measure no-load speed with the load decoupled at full command.
5. For efficiency, log bus voltage and current at each point; efficiency is shaft power (torque times angular speed) over electrical power in.
6. Write points in ascending rpm (**checked**). Torque must not rise more than the stated uncertainty above the lowest torque at any lower speed (**checked**: a monotonic envelope).

### Thermal

1. Start with the winding at ambient. Hold a constant torque at a stated low speed (or locked rotor, said in `methodNote`) until the controller derates or the winding reaches the maker's limit.
2. Record the torque, the time to that point and the winding temperature rise above ambient (**checked**: every point needs `windingRiseC`).
3. Cool to ambient and repeat at lower torques; at least 3 torques (**checked**). The lowest may run 30 minutes without reaching the limit: record `tToLimitS` as `null` for it, and only for it (**checked**).
4. List points from highest to lowest torque; a lower torque must last at least as long (**checked**).

Continuous torque on /benchmarks is the highest torque held for 600 s or without reaching the limit.

### Transmission (optional)

- **Backlash**: lock the motor side, apply plus and minus 5% of rated torque at the output and read the dead band on the output encoder, in arcmin.
- **Torsional stiffness**: lock the motor side, step the torque applied at the output to 50% of rated in both directions and take the slope of torque against output angle, in N·m/rad.
- **Backdrive friction**: with the actuator unpowered, the torque needed at the output to start it turning, in N·m.
- **Torque ripple**: at 10% of no-load speed and 50% of rated torque, peak-to-peak ripple over one output turn as a percentage of the mean.

### Control (optional)

- **Bandwidth**: the -3 dB frequency of a torque (or position) chirp from 1 Hz upward at 20% of rated torque, in Hz; say which loop in `methodNote`.
- **Latency**: time from the command frame on the bus to the first measurable torque change, over CAN or EtherCAT at a stated bitrate, in ms.
- **Repeatability**: 30 approaches to one position from the same side under no load; report the spread at 2 standard deviations, in arcmin.

## Samples and uncertainty

- Each reported number is the mean of at least 3 repeats.
- Give the uncertainty of every metric you report, as plus or minus in the metric's own unit, in `uncertainty` keyed by the metric name (**checked**: one per reported metric and no others). For `torqueSpeed` and `thermal` it is in N·m of torque. Efficiency on the T-N points takes its own key, `efficiency`, as a fraction (**checked**: required for lab and community runs; a published run without it says in `methodNote` that it is not quantified).
- The uncertainty combines the sensor's accuracy class at the reading and the spread of the repeats (2 standard deviations).
- The raw readings go in `torque-speed.csv` (`rpm,torque_nm,efficiency`) and `thermal.csv` (`torque_nm,t_to_limit_s,winding_rise_c`), one row per reading, within the same bounds as `run.json`: speed, T-N torque and efficiency may be zero, thermal torque, time and winding rise must be above zero (**checked**). Every `run.json` point needs rows at its speed (within 0.5 rpm) or torque (within the thermal uncertainty): a T-N torque must be within its uncertainty of the rows' mean, and a thermal time and winding rise must lie within the rows' range, with blank times exactly for a continuous point (**checked**).

## Plausibility

The validator compares the highest torque anywhere in the run (the stated `peakTorqueNm` or any curve point, whichever is higher) with the catalog's datasheet peak. A ratio outside 0.3x to 1.5x usually means a unit slip (kg·cm for N·m) or a current limit set too low, and fails CI (**checked**) unless `plausibilityNote` explains why the result is real.

## Published runs

A published run cites a source registered in `src/benchmarks/sources.ts` with its `reuse` value (**checked**), and states in `dataMethod` how the numbers were taken (never `raw`, **checked**):

- `tabulated`: copied from a table in the source.
- `digitised`: read off a plot by us. Say how in `methodNote` (**checked**) and use the reading error as the uncertainty. A digitised plot is never presented as raw data.
- `reported`: single figures quoted in the source's text. A quoted range is entered as its mid-point with half the range as the uncertainty, and a bound ("under 0.5 N·m") as the range from zero to the bound.

When a source states no uncertainty, `methodNote` says so and gives the basis of the value entered: a reading error, the rounding of the printed figures, or our own estimate.

Vendor test reports are the maker's own measurements. They are badged as vendor data and kept apart from independent tests in the text, though they are ranked alongside them. A run on hardware other than the catalog entry's revision sets `otherRevision` and is shown but not ranked. A run on the catalog revision that still should not stand for it (a driver limit rather than the actuator, or data the source appears to have copied from another model) sets `notRanked` to the reason, with the same effect.
