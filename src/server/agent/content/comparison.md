# CubeMars AK80-9 V3.0 vs Xiaomi CyberGear: what the engineering evidence actually establishes


The AK80-9 V3.0 has higher published output torque ratings; original CyberGear is the lighter, lower-voltage configuration. [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) Those differences support initial sizing. They do **not** establish which is more efficient at a shared operating point, which stays cooler on a repeated mission, or which achieves better loaded repeatability.

## Exact configurations compared

- **CubeMars AK80-9 V3.0 KV100**, model-specific manufacturer page, with the companion AK Series Module Product Manual **V3.2.0**. [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) [AK family manual V3.2.0](https://www.cubemars.com/data/cms/202602/ak-series-prodcut-manual-v3-2-0-for-ak-3-0-robotic-actuator.pdf) Manual V3.2.0 must not be mistaken for actuator hardware V3.2.
- **Original Xiaomi CyberGear**, the **24 V, 7.75:1, 317 g** configuration in the original Chinese 30-page manual. [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) The document does not establish a named hardware revision or installed firmware. “Original” is a document-scoped identity, not an invented V1 label. Any different CyberGear hardware must be compared separately.

The CyberGear evidence is a manufacturer-authored document hosted on a third-party mirror, not a Xiaomi-origin authenticated download. The mirror's TLS certificate was expired at retrieval, lowering provenance confidence to moderate. An unofficial English translation was rejected as primary evidence. Confirm hardware markings and firmware on actual units before procurement or parameter export.

## Product photos

- [![CubeMars AK80-9 V3.0 KV100 product photo](/actuator-images/cubemars-ak80-9.webp)](/actuators/cubemars-ak80-9) **[CubeMars AK80-9 V3.0 KV100](/actuators/cubemars-ak80-9)**. Manufacturer/distributor product image from the existing catalog, not a measured test. The face label shows V3.0 KV100; the photo does not verify installed firmware.
- [![Xiaomi CyberGear product photo, original configuration illustrative](/actuator-images/xiaomi-cybergear.webp)](/actuators/xiaomi-cybergear) **[Original Xiaomi CyberGear](/actuators/xiaomi-cybergear)**. Manufacturer/distributor product image from the existing catalog, not a measured test. Revision is illustrative: confirm hardware markings, firmware and the documented 24 V configuration on the actual unit.

## Manufacturer specifications, not independent bench results

| Property | AK80-9 V3.0 KV100 | Original CyberGear | Interpretation |
|---|---|---|---|
| Nominal voltage | 48 V  [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) | 24 V; operating 16–28 V  [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) | Do not use the AK's nominal bus on CyberGear. |
| Rated output torque | 9 N·m  [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) | 4 N·m  [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) | Vendor ratings; identical cooling/mounting conditions not demonstrated. |
| Peak output torque | 22 N·m  [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) | 12 N·m  [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) | Separate peak endpoints, not sustained ratings. |
| Rated output speed | 390 rpm  [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) | 240 rpm ±10%  [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) | Check the required simultaneous torque–speed point. |
| No-load output speed | 570 rpm  [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) | 296 rpm ±10%  [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) | Not usable full-torque speed. |
| Reduction | 9:1  [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) | 7.75:1  [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) | Ratio alone does not establish efficiency or friction. |
| Mass | 490 g  [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) | 317 ±3 g  [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) | Listed product masses; do not infer thermal capacity from mass alone. |
| Encoder | Model page: one inner magnetic encoder, 16-bit, no outer encoder  [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) | 14-bit single-turn absolute  [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) | Not loaded output precision. AK family manual lists 21-bit inner-loop sensing: unresolved revision/scope discrepancy. [AK family manual V3.2.0](https://www.cubemars.com/data/cms/202602/ak-series-prodcut-manual-v3-2-0-for-ak-3-0-robotic-actuator.pdf) |
| Backlash / backdrive | 15 arcmin / 0.51 N·m  [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) | No corresponding quantified entries established in the inspected manual  [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) | Unknown is not zero. AK test conditions are not stated. |

**Engineering inference:** Screen AK for greater torque demands and CyberGear for lower mass and compatible voltage. [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) This is conditional sizing guidance, not a reliability, thermal, or efficiency ranking.

## Efficiency: no demonstrated winner

**Manufacturer specification:** the AK product page includes a “9%” efficiency-improvement claim, without a sufficient operating-point/baseline definition or percent-versus-percentage-point basis to turn it into absolute complete-actuator efficiency. [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) The inspected CyberGear manual does not provide a comparable bus-to-output efficiency map. [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf)


**Engineering inference:** compare both at overlapping output torque–speed points and temperatures, then replay the target trajectory. Account for driver and cooling energy at the chosen boundary. Do not compare a gearbox-only efficiency with a complete actuator number, or multiply rated voltage by an ambiguously defined phase current to claim measured efficiency.


**Not published/unknown:** an absolute efficiency percentage, an efficiency advantage, or a battery-runtime improvement between these exact configurations. **Quantitative estimate not defensible.** Qualitative confidence in an efficiency ranking: low.

## Thermal duty: CyberGear documents an overload envelope, not a cooldown guarantee

**Manufacturer specification / manufacturer-reported test:** original CyberGear supplies maximum-overload data with these conditions: 25 °C ambient, 120 °C winding limit, and **24 rpm**. [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf)

| Output load | Reported operating time |
|---|---:|
| 12 N·m | 28 s |
| 8 N·m | 160 s |
| 6 N·m | 700 s |
| 5 N·m | 1800 s |
| 4.5 N·m | 2500 s |
| 4 N·m | Rated |

Source: original Chinese manual §1.3.15, PDF pp. 4–5; embedded table visually checked. [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) These are selected rows, not interpolation or newly measured results. The speed is **24 rpm**, not the 240 rpm rated-speed entry. Initial winding temperature, test fixture/cooling, repeatability, and recovery time are unspecified. Do not call the 28-second entry a repeatable 12 N·m duty cycle.

**Manufacturer specification:** AK's model-specific page publishes an ambient range and protection features, but the reviewed material does not establish an equivalent mounting-specific overload-and-recovery table for the V3.0 configuration. [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) [AK family manual V3.2.0](https://www.cubemars.com/data/cms/202602/ak-series-prodcut-manual-v3-2-0-for-ak-3-0-robotic-actuator.pdf) Family-driver board limits and assembled-actuator ambient limits are different categories; never use them as interchangeable thermal endpoints.


**Engineering inference:** identify winding/housing thermal parameters in the actual fixture and validate repeated cycles from warm start. Worse cooling or greater loss can shorten duty, all else equal; product-ranking confidence is low.

**Not published/unknown:** which unit runs longer on the same mission, continuous torque in a sealed enclosure, and minutes required to cool. **Quantitative estimate not defensible** without thermal/loss data and a restart criterion.

## Precision and repeatability: encoder bits do not settle the question

**Manufacturer specification:** AK provides backlash and inner-encoder data; its family manual and model page conflict on encoder resolution. [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) [AK family manual V3.2.0](https://www.cubemars.com/data/cms/202602/ak-series-prodcut-manual-v3-2-0-for-ak-3-0-robotic-actuator.pdf) CyberGear's debugger distinguishes rotor/encoder and output positions, but the reviewed manual does not establish an independently measured load-side repeatability figure. [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf)

**Engineering inference:** use external output metrology with matched load, gains, temperature, direction and settling time. Separate bias, scatter, torsional deflection and reversal hysteresis. Inner-encoder consistency cannot resolve load-side play.


**Not published/unknown:** a defensible numeric accuracy/repeatability comparison. AK's published backlash is a useful screening datum, not a demonstrated positioning victory over an actuator with unpublished backlash. **Quantitative estimate not defensible**; confidence in ranking is low.

## Sim2real modelability: distinguish accessible controls from a validated model

Firmware, control mode, gains, current scaling and limits must be pinned before identification. [AK family manual V3.2.0](https://www.cubemars.com/data/cms/202602/ak-series-prodcut-manual-v3-2-0-for-ak-3-0-robotic-actuator.pdf) and [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf).

**Published research measurement:** ANYmal work included command history and actuator/software dynamics in a learned torque model. [Hwangbo et al., ANYmal](https://arxiv.org/pdf/1901.08652) Saturn Lite experiments show robot-specific failures when static friction was inadequately represented. [Hu et al., static friction](https://arxiv.org/pdf/2503.01255) Neither paper measures sim2real errors for AK80-9 versus CyberGear.

**Engineering inference:** identify command-to-output delay, saturation, friction/stiction, inertia, backlash, compliance and temperature dependence. Validate on held-out loads and trajectories. Interface availability and CAN bitrate do not establish transfer success or measured bandwidth.

**Not published/unknown:** which exact module yields lower model residuals or better zero-shot transfer. **Quantitative estimate not defensible** before a matched identification campaign.

## Verdict: select on requirements, then close the unknowns

For initial screening, AK80-9 V3.0 offers the higher published torque envelope and original CyberGear the lower listed mass/nominal voltage. [CubeMars model specification](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) [Original Chinese manual, mirror](https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf) For engineering sign-off, require the same four outputs from each candidate: a bus-to-output map, a mounting-specific repeated-duty thermal test, loaded bidirectional output metrology, and held-out actuator-model errors. Until then, efficiency, cooling endurance, precision, and sim2real “wins” remain unproven.



## Continue selecting

[Engineering guides](/guides) · [Actuator catalog](/actuators) · [Motor torque calculator](/tools/motor-torque-calculator) · [Humanoid robot actuators](/guides/humanoid-robot-actuators)

See the [selection guide](/guides/robot-actuator-selection) for the full measurement and calibration protocol.
