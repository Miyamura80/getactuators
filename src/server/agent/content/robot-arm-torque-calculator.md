# Robot arm torque calculator: static holding torque per joint

Enter link lengths, link masses, the mass of each actuator and the payload. The calculator returns the holding torque at every pitch joint with the arm held horizontal, draws the free-body diagram, and screens the catalog for actuators that reach each joint. Pick an actuator and its catalog mass feeds back into the joints behind it.

## How the calculation works

With the arm straight out and horizontal, gravity acts on every mass at its full horizontal distance from each joint, so this is the worst static case for the shoulder, elbow and wrist pitch joints at once. Each joint must hold everything outboard of it:

τᵢ = g × Σ mₖ × (xₖ − xᵢ), summed over every mass k beyond joint i

The masses are each link's own structure, placed at a fraction of its length you choose (the middle by default), each actuator at the joint it drives, and the payload with the gripper at the tip. g is 9.807 m/s². An actuator's own mass does not load the joint it sits on, because it acts at that joint's axis; it loads every joint closer to the base.

## Worked example

The "mobile manipulator" example has links of 0.40, 0.35 and 0.12 m weighing 1.2, 0.8 and 0.3 kg, a 1.0 kg elbow actuator, a 0.5 kg wrist actuator and a 2 kg payload. These are example inputs, not specifications of any product.

| Joint | Holding torque | Largest term |
| --- | --- | --- |
| Shoulder | 33.9 N·m | Payload: 2 × 9.807 × 0.87 = 17.1 N·m |
| Elbow | 13.5 N·m | Payload: 2 × 9.807 × 0.47 = 9.2 N·m |
| Wrist | 2.5 N·m | Payload: 2 × 9.807 × 0.12 = 2.4 N·m |

Adding 0.5 kg to the wrist actuator raises the shoulder requirement by 0.5 × 9.807 × 0.75 = 3.7 N·m and the elbow by 1.7 N·m. Distal mass is expensive, which is why the calculator lets you try real catalog masses at each joint.

## Assumptions you can see and change

- **Pose:** arm horizontal, the worst static case for pitch joints. A base yaw joint carries no gravity torque in this model.
- **Link center of mass:** a single fraction of each link's length for all links. Hollow links with heavy ends need a different value.
- **Actuator masses:** placed at the joint axes they drive. Use a catalog mass, or measure your own.
- **Rigid and planar:** no deflection and no out-of-plane offsets.

## What the result does not tell you

- **Not motion torque.** Accelerating the arm adds inertia × angular acceleration at every joint, and friction adds more. Neither is modeled. A static calculation does not establish dynamic or thermal suitability.
- **Compare with rated, not peak.** Holding a load is continuous duty. The shortlist ranks entries whose rated torque covers the holding torque first; a peak-only fit can lift the load briefly but is not shown to hold it.
- **No universal margin.** A multiplier on top of this result is a design decision tied to your uncertainties, not a safety certificate. Real safety depends on braking, collisions, control and standards that a torque sum does not cover.
- **Gearbox output.** Catalog torques for integrated actuators are output-side values. For a separate motor and reducer, use the [motor torque calculator](/tools/motor-torque-calculator) to reflect the joint requirement back to the motor shaft.

## From requirement to actuator

Select a joint on the diagram or in the results to screen the catalog at its holding torque. Each candidate shows rated and peak torque, maximum speed and mass, with undocumented values marked "n/d" rather than treated as zero. Use a candidate's mass at that joint to see how it loads the joints behind it, then open the shortlist in [Compare](/compare). For humanoid arms, the [humanoid actuator guide](/guides/humanoid-robot-actuators) gives worked shoulder, elbow and wrist estimates, and the [actuator selection guide](/guides/robot-actuator-selection) covers efficiency, thermal duty and precision.

## Questions

### How do you calculate robot arm joint torque?

For static holding, multiply each mass beyond the joint by g and by its horizontal distance from the joint, and add the results. With the arm horizontal the distances are greatest, so that pose gives the worst static case.

### Why does the shoulder need so much more torque than the wrist?

The shoulder holds every link, actuator and the payload, each at a longer lever arm. Torque grows with both mass and distance, so the shoulder sees the sum of everything outboard.

### Should I size a robot arm motor from peak torque?

Not for holding. A load held against gravity is continuous, so compare it with rated (continuous) torque at your cooling and ambient conditions. Peak torque covers short accelerations.
