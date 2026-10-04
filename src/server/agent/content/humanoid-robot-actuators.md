# Humanoid robot actuators: what each joint needs and which catalog parts reach it

A humanoid has no single right actuator. The knee, the ankle and the wrist load their motors in different ways, so each joint gets its own shortlist. Select a numbered joint on the map to see its static torque estimate and the catalog entries that reach it. Each estimate is a worked example for a hypothetical robot, and the shortlists come straight from the catalog data: where a value is not documented, it is reported as unknown.

## How to read this guide

The reference robot is **hypothetical**: 1.5 m tall, 50 kg, carrying 1 kg in one hand. Every torque below is a **static engineering estimate** (mass × g × horizontal lever arm) for one stated pose, rounded to one decimal place. Static torque is a floor, not a requirement: walking, stairs, recovery steps and impacts add dynamic torque that depends on your gait and controller, and that this guide does not estimate.

Each shortlist screens catalog entries tagged for humanoid joints. An entry passes when its documented rated torque covers the estimate (listed first) or, failing that, its documented peak torque does (short duty only). Undocumented torque never passes. Use the [motor torque calculator](/tools/motor-torque-calculator) to screen the whole catalog at your own torque and speed, and the [actuator selection guide](/guides/robot-actuator-selection) for the efficiency, thermal, precision and sim2real checks a shortlist does not settle.

## Shoulder

Shoulder pitch carries the whole arm and its payload when the arm reaches forward. It is the highest-torque arm joint, and its actuator mass sits close to the torso, where it costs little extra torque elsewhere.

{{joint:shoulder}}

## Elbow

The elbow carries only the forearm, hand and payload, but its actuator mass hangs on the upper arm and adds to the shoulder's load. Mass per unit of torque matters more here than at the shoulder.

{{joint:elbow}}

## Wrist

Wrist torque is small; the constraints are size, mass and backlash at the end of a long lever. Every gram here is multiplied by the full arm length at the shoulder.

{{joint:wrist}}

## Waist

Waist pitch holds the upper body when it leans. Waist yaw sees little gravity load; its torque comes from accelerating the upper body's inertia, which depends on your motion and is not estimated here.

{{joint:waist}}

## Hip

In single-leg stance the hip must hold the rest of the body against tipping sideways (hip roll) and forward (hip pitch). Hip actuators sit at the pelvis, so their mass is cheap to carry, and they are usually among the largest in the robot.

{{joint:hip}}

## Knee

The knee usually needs the most torque in the leg: rising from a crouch or landing a step puts body weight on a bent knee with a long lever. A knee that must also absorb impacts benefits from backdrivability, which the catalog records when documented.

{{joint:knee}}

## Ankle

The ankle balances the body over the foot, so its torque grows with how far the center of pressure moves from the ankle axis. Its actuator is the most distal mass in the leg, which is why many designs place the ankle motors higher on the shank and drive the ankle through linkages; with a linkage, the motor-side torque differs from the joint torque by the linkage ratio.

{{joint:ankle}}

## What this guide does not establish

- **Which actuators commercial humanoids use.** Product photos, teardowns and press coverage rarely confirm the exact installed model and revision. This guide treats installed components as unknown unless a manufacturer documents them.
- **Dynamic and thermal duty.** A joint that holds its static estimate for minutes needs rated (continuous) torque at the installed cooling; peak torque is time-limited. Duty depends on the gait, the controller and the enclosure.
- **A best joint actuator.** The highest torque density is not the best choice for every joint. Mass at the wrist, backdrivability at the knee and envelope at the ankle pull in different directions.
- **Torque–speed envelopes.** A catalog rating is one point. Confirm torque at the joint speeds your gait needs, at your bus voltage.

## Next steps

Pick two to four candidates per joint and open them in [Compare](/compare). Check each candidate's sources and revision on its catalog page. Then work through the [selection guide](/guides/robot-actuator-selection): mission energy, warm duty, loaded repeatability and a held-out model fit, measured on the installed joint.
