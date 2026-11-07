# How to select a robot actuator: efficiency, thermal duty, precision, and sim2real


Peak torque is an incomplete selection criterion. A useful shortlist must also establish energy consumption on the intended trajectory, sustained thermal behavior, loaded output positioning, and whether the installed control stack can be identified accurately enough for simulation. Research characterizing geared actuators measures these properties separately rather than treating a motor constant or encoder specification as a complete performance description. [Urs et al., actuator characterization](https://arxiv.org/pdf/2202.12395)

## Identify what is included

A reducer is not a complete motor-and-drive actuator. A sensorized reducer adds sensing, not necessarily a motor. These two catalog illustrations show why the integration boundary belongs on the acceptance sheet; drawings and selected variants still govern the build.

- [![Leaderdrive LCS cup-shaped strain-wave reducer product photo](/actuator-images/leaderdrive-lcs.webp)](/actuators/leaderdrive-lcs) **[Leaderdrive LCS: reducer family](/actuators/leaderdrive-lcs)**. Manufacturer/distributor product image from the existing catalog, not a measured test. Family/variant illustrative; the original image watermark is preserved. Read the [manufacturer's input-variant description](https://www.leaderdrive.com/product/6.html) before choosing a configuration.
- [![Nidec Smart-FLEXWAVE SRH sensorized hollow-shaft reducer product photo](/actuator-images/nidec-smart-flexwave-srh.webp)](/actuators/nidec-smart-flexwave-srh) **[Smart-FLEXWAVE SRH: sensorized reducer](/actuators/nidec-smart-flexwave-srh)**. Manufacturer/distributor product image from the existing catalog, not a measured test. Family/variant illustrative; distinguish [WPU-SRH-BD sensing](https://www.nidec-dtc.com/product/srh-series-wpu-srh-bd/) from a complete servo joint.

## Read every claim through an evidence label

**Manufacturer specification** describes the vendor's stated product limits. **Published research measurement** describes a result under the paper's test conditions. **Engineering estimate/inference** describes an explicitly conditional model or judgment. **Not published/unknown** means the inspected evidence does not establish the answer. Never convert the last category into an apparently measured number.

The steps below are a **proposed engineering workflow**, not a test campaign already performed on the products listed on this site.

## 1. Start with the joint's trajectory, not a torque headline

Specify required output torque and speed over time, including reversals, acceleration, gravity holding, and disturbance recovery. Define normal operation and exceptional events separately. Record link inertia, payload, bus-voltage range, mounting, airflow, ambient conditions, allowable temperatures, and target positioning errors.

For a first static number, the [robot arm torque calculator](/tools/robot-arm-torque-calculator) gives holding torque at each arm joint, the [humanoid actuator guide](/guides/humanoid-robot-actuators) estimates each joint of a 50 kg humanoid, and the [motor torque calculator](/tools/motor-torque-calculator) converts between torque, power and speed. Treat these as floors: the trajectory sets the real requirement.

Request a torque–speed envelope with voltage and temperature conditions. Do not assume peak torque remains available at the no-load speed. Vendor data can distinguish rated points from separate peak and no-load endpoints; the AK80-9 V3.0 and original CyberGear documentation do so. [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf)

**Engineering inference:** retain the lowest-complexity candidate that meets the measured mission envelope with a justified margin. A margin is a design decision tied to uncertainties and risk, not an unexplained universal multiplier.

## 2. Compare bus-to-output efficiency at shared operating points

Define the boundary before comparing a percentage. In motoring operation, mechanical output power is output torque times output angular velocity; complete actuator efficiency compares that power with measured DC-bus electrical input. Published actuator characterization uses bus power meters together with torque and speed measurements across many operating points, including negative mechanical work. [Urs et al., actuator characterization](https://arxiv.org/pdf/2202.12395)

A reducer efficiency measures only the transmission boundary. It must not be presented as the efficiency of motor, inverter, reducer, bearings, and auxiliary electronics together. Likewise, a relative marketing improvement with an unspecified baseline does not establish an absolute efficiency map.

### Proposed measurement protocol

- Use a calibrated output torque transducer and independent output speed measurement, synchronized with signed bus voltage/current.
- Measure both actuators at overlapping output torque–speed points with recorded bus voltages. Also test each in its intended system; “same voltage” is inappropriate if it violates one product's limits.
- Run positive and negative work in both directions; record winding/sensor and driver temperatures and allow documented thermal stabilization.
- Include idle power and cooling power if the comparison is intended to represent installed-system energy.
- Report uncertainty, sample count, firmware, temperature, and fixture. Do not publish only the most favorable point.
- For a mission, integrate signed bus power over the actual trajectory. Report motoring consumption, returned energy, and losses separately; verify whether the supply accepts regeneration.

**Engineering inference:** a static holding task still deserves an electrical-power and heating measurement even though its useful mechanical motion is zero. An efficiency percentage alone is a poor selection metric there. Low-speed/high-torque heating is prominent in the published printed-QDD measurements, but its numerical map cannot be transferred to another actuator. [Urs et al., actuator characterization](https://arxiv.org/pdf/2202.12395)

**Not published/unknown:** without matched measurements, do not declare the most efficient AK80-9 or CyberGear, estimate a battery-life uplift, or infer efficiency from rated current alone. Bus current, RMS phase current, and driver torque-current scaling must first be distinguished; the manufacturer's motor and driver tables demonstrate why scope matters. [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) [AK family manual V3.2.0](https://www.cubemars.com/data/cms/202602/ak-series-prodcut-manual-v3-2-0-for-ak-3-0-robotic-actuator.pdf) [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf)

## 3. Treat cooling and duty cycle as installed-system properties

A peak torque needs a duration and recovery condition. A rated torque needs the manufacturer's ambient, speed, mounting, and cooling assumptions, or a test showing that the installed assembly reaches a safe thermal steady state.

The original CyberGear manual, hosted on a third-party mirror whose TLS certificate was expired at retrieval (moderate provenance confidence; not Xiaomi-origin authenticated), supplies an overload table at 25 °C ambient, a 120 °C winding endpoint, and **24 rpm**. [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) That is useful vendor-reported evidence, not permission to repeat the overload continuously or a measured cooldown time. The table does not specify a repeat-cycle recovery interval. [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf)

### Proposed thermal model

Use at least winding and housing nodes when a single-node model cannot predict both heating and recovery. A suitable starting structure is:

```text
Cw dTw/dt = P_copper(Tw, phase currents) + allocated internal losses
            - (Tw - Th) / Rwh
Ch dTh/dt = (Tw - Th) / Rwh + housing/driver losses
            - (Th - Ta) / Rha
```

Here `Tw`, `Th`, and `Ta` are winding, housing, and ambient temperatures. `Rwh`, `Rha`, `Cw`, and `Ch` are experimentally identified thermal parameters. Copper loss should use the sum of phase-current-squared times the corresponding temperature-dependent phase resistance, not an unqualified DC-bus-current substitution. Research supports experimentally identified thermal networks and temperature-dependent resistance, rather than assuming a catalog temperature is the winding temperature. [Urs et al., actuator characterization](https://arxiv.org/pdf/2202.12395) [Colmenares et al., thermal identification](https://arxiv.org/pdf/2002.00798)

This is an **engineering model proposal**. Allocation of iron, bearing, gearbox, inverter, and fan losses must match the chosen boundary. Add a driver node or speed-dependent convection if validation residuals require it; the miniature DC-actuator study explicitly identified convection and friction effects. [Colmenares et al., thermal identification](https://arxiv.org/pdf/2002.00798)

### Proposed thermal acceptance test

1. Log actual torque, speed, bus power, sensor readings, external case temperature, ambient, and protection/derating events.
2. Run the mission from cold start and from the warm state expected between cycles.
3. Identify heating and cooling behavior using controlled loads, including near-stationary holding and representative motion.
4. Fit parameters on one dataset and validate on unseen duty profiles, ambient conditions, and mounting variants.
5. Define restart using a validated thermal state or documented manufacturer procedure, not an arbitrary elapsed pause.

**Engineering inference:** more cooling can improve usable duty, but its benefit depends on the heat path and airflow. Fans substantially changed thermal resistance in one published printed-actuator design; its improvement factor is not a prediction for a metal enclosed actuator. [Urs et al., actuator characterization](https://arxiv.org/pdf/2202.12395)

**Not published/unknown:** if losses, thermal parameters, initial state, and limits are missing, a numerical runtime or cooldown estimate is not defensible. The bounded qualitative expectation is only “higher heating or weaker cooling can shorten duty, all else equal”; confidence in a product-to-product ranking remains low.

### Runtime is not a thermal rating

Battery endurance and joint thermal duty are different acceptance criteria. A long battery-life claim cannot establish how long a joint can sustain a particular load. Validate temperature and derating on the intended mission rather than assume a fixed runtime or cooldown interval.

## 4. Measure output accuracy and repeatability, not just encoder resolution

For this guide, use **accuracy** to mean systematic error against an external output reference, and **repeatability** to mean the spread of repeated achieved outputs under a stated protocol. Encoder quantization is a sensing attribute; it is not a loaded output-positioning result.

The distinction matters in geared modules: the model-specific AK page reports a single inner encoder and separate backlash, while the CyberGear debugger distinguishes rotor/encoder position from output position. [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) Reported output position must not automatically be treated as an independently sensed output shaft.

### Proposed metrology and calibration protocol

Use independent output metrology, not only the actuator's own telemetry. Repeat targets from both directions, at stated dwell times, speeds, gains, and external torques. Test across the working range and after warm-up. Report mean bias, scatter, worst-case error, and reversal hysteresis separately; state the definition used for every number.

Measure torsional compliance under load, reversal play, breakaway torque, and low-speed friction. Re-test after wear or maintenance. Lifecycle actuator research shows why an inferred backlash change needs assumptions about encoder drift and material stiffness stated explicitly. [Urs et al., actuator characterization](https://arxiv.org/pdf/2202.12395)

Separate encoder electrical calibration, current-sensor offset, mechanical zero, gear mapping, and load-side alignment. Persist/read back the configuration and re-check zero after power cycling. The CyberGear manual explicitly describes encoder recalibration after relevant assembly/wiring changes and a mechanical zero setting that is lost on power-off in the documented procedure. [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf)

**Not published/unknown:** neither encoder bit depth nor a backlash entry provides a defensible numerical repeatability estimate for a loaded robot joint. Confidence in a precision ranking is low until both products undergo the same external-reference test.

## 5. Select for modelability of the installed control stack

A CAD file and a torque limit are not a validated sim2real actuator model. ANYmal research modeled the history-dependent mapping from commands to joint torques, including delay and low-level behavior omitted by rigid-body dynamics. [Hwangbo et al., ANYmal](https://arxiv.org/pdf/1901.08652) Static-friction experiments on another robot show that including inertia and gains while omitting stiction can still leave important transfer errors. [Hu et al., static friction](https://arxiv.org/pdf/2503.01255)

### Proposed minimum model and identification campaign

Start with a grey-box model containing:

- Consistent rotor/output coordinate conventions and reflected inertia.
- Static/breakaway and sliding friction; viscous friction; a Stribeck or hysteretic component only when measurements justify it.
- Gear backlash and torsional compliance under reversal, not merely a reduced average torque.
- Mode-specific control gains, saturation, actual torque–speed limits, voltage dependence, and thermal derating.
- Command sampling/hold behavior, transport delay, telemetry delay, and timestamp jitter.
- Encoder bias/noise, quantization, and mechanical-zero conventions.

Use current/torque steps, safe chirps or multisine excitation, small-amplitude reversals, load changes, and temperature sweeps. Measure command-to-output torque and motion, not just current-loop behavior. Report latency, bandwidth, and tracking residuals as different quantities. A CAN bitrate is not a closed-loop bandwidth measurement; published actuator tests report step response and frequency response separately. [AK family manual V3.2.0](https://www.cubemars.com/data/cms/202602/ak-series-prodcut-manual-v3-2-0-for-ak-3-0-robotic-actuator.pdf) [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) [Urs et al., actuator characterization](https://arxiv.org/pdf/2202.12395)

Fit on one dataset and validate on held-out amplitudes, trajectories, temperatures, and loads. Randomize parameters over empirically justified uncertainty ranges. Add a learned residual/history model only where it improves held-out behavior; avoid hiding an unobserved temperature or bus-voltage dependence inside a model trained on one condition.

**Engineering inference:** accessible telemetry and adjustable control parameters help identification, but do not guarantee successful transfer. **Not published/unknown:** no numerical sim2real advantage between the exact AK80-9 and CyberGear configurations is established by this review.

## Selection deliverable: an evidence-backed acceptance sheet

For each candidate, publish the exact hardware/firmware revision, rated versus peak envelope, shared-point energy results, mounting-specific thermal validation, externally measured loaded repeatability, and held-out actuator-model errors. Where any item remains unknown, label it unknown and state the test needed to resolve it. A transparent uncertainty column is more useful than an invented winner.


## Continue selecting

[Engineering guides](/guides) · [Actuator catalog](/actuators) · [Motor torque calculator](/tools/motor-torque-calculator) · [Robot arm torque calculator](/tools/robot-arm-torque-calculator) · [Humanoid robot actuators](/guides/humanoid-robot-actuators)

Read the [AK80-9 V3.0 versus original CyberGear comparison](/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear) for a version-scoped example.
