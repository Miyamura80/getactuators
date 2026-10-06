# Motor torque calculator: torque, power and RPM

Calculate shaft torque from power and speed, power from torque and speed, or speed from power and torque. Units: N·m, N·cm, kgf·cm, lbf·ft, lbf·in and oz·in; W, kW and hp; rpm, rad/s and rev/s. An optional gearbox stage reflects an output requirement back to the motor shaft. The result links to catalog actuators whose documented rated or peak torque reaches it.

## How the calculator works

Power, torque and speed on a rotating shaft are tied by one relation: mechanical power equals torque times angular velocity. Enter any two and the calculator returns the third. The same formula applies to brushed DC, brushless (BLDC), stepper and servo motors, and to the output of a geared actuator, because it describes the shaft.

The nomograph beside the inputs draws the same relation. Torque and speed sit on logarithmic scales at the edges and power sits midway at half the scale, so one straight line through a torque and a speed crosses the exact power.

## Formulas

| Units | Torque | Power |
| --- | --- | --- |
| N·m, W, rpm | T = 9.549 × P / n | P = T × n / 9.549 |
| N·m, kW, rpm | T = 9549 × P / n | P = T × n / 9549 |
| lbf·ft, hp, rpm | T = 5252 × P / n | P = T × n / 5252 |
| lbf·in, hp, rpm | T = 63025 × P / n | P = T × n / 63025 |

The constant 9.549 is 60 / 2π, which converts rpm to rad/s (ω = 2π × n / 60). With ω in rad/s the relation is P = T × ω.

## Unit conversions

| Torque unit | Equals |
| --- | --- |
| 1 N·m | 0.7376 lbf·ft, 8.851 lbf·in, 141.6 oz·in, 10.20 kgf·cm |
| 1 lbf·ft | 1.356 N·m |
| 1 kgf·cm | 0.0981 N·m |
| 1 hp (mechanical) | 745.7 W |
| 1 rad/s | 9.549 rpm |

## Worked robotics examples

Inputs are illustrative and describe no specific robot.

### 7.85 N·m to hold 2 kg at 0.4 m on an arm

A 2 kg mass held horizontally 0.4 m from a shoulder axis needs 2 × 9.807 × 0.4 = 7.85 N·m of holding torque, before the arm's own link and actuator mass. Moving it at 20 rpm takes 7.85 × 20 / 9.549 = 16.4 W of shaft power. Holding still takes zero mechanical power, yet the motor still draws current and heats, so size holding torque as a thermal requirement.

### 377 W for a leg joint at 18 N·m and 200 rpm

A joint that must produce 18 N·m while turning at 200 rpm delivers 18 × 200 / 9.549 = 377 W at the output. Electrical input is higher by the motor and driver losses at that operating point.

### 0.637 N·m from a 200 W drive motor at 3000 rpm

A 200 W motor running at 3000 rpm supplies 9.549 × 200 / 3000 = 0.637 N·m at its shaft.

### 2.22 N·m at 1800 rpm behind a 9:1 gearbox

Behind a 9:1 stage with an assumed 90% efficiency, the 18 N·m, 200 rpm leg requirement becomes 18 / (9 × 0.9) = 2.22 N·m at 1800 rpm on the motor shaft, and 377 / 0.9 = 419 W of motor shaft power. You choose the efficiency. Real efficiency varies with load, speed and temperature.

## What the result does not tell you

- **Shaft power only.** Electrical input equals shaft power divided by the combined motor and driver efficiency at that torque and speed. Measure it, or read it from a matched efficiency map.
- **Stall torque is a motor rating.** At zero speed the formula gives zero power for any torque, so it says nothing about stall or holding torque. Current and thermal limits set those.
- **Check the torque–speed envelope.** A computed torque is a requirement. Whether a motor delivers it at that speed depends on its envelope at your bus voltage, which falls with speed.
- **Continuous load needs rated torque.** Peak torque is usually time-limited. A load held continuously must fit under the rated torque at the installed cooling and ambient temperature.

## From requirement to actuator

After a result, the calculator lists catalog actuators that reach the torque. Entries whose documented rated torque covers the requirement come first, then entries where only the peak torque does. When a speed is given, entries whose documented maximum speed is lower are dropped, and entries with no documented speed are marked unknown. Parts sold without drive electronics are labeled. Pick up to four and open them side by side in [Compare](/compare), or read the [actuator selection guide](/guides/robot-actuator-selection) for the efficiency, thermal and precision checks that come next.

## Questions

### How do you calculate motor torque from power and rpm?

Divide power by angular speed. In SI units, torque in N·m equals 9.549 × power in watts ÷ speed in rpm. For example, 100 W at 300 rpm is 3.18 N·m.

### How do you calculate DC motor torque?

The same way as any rotating shaft: from shaft power and speed. A brushed DC motor's torque is also roughly proportional to current (torque constant Kt × current), and that needs the motor's Kt, which this calculator does not ask for.

### What is the difference between rated and peak torque?

Rated (continuous) torque is what the motor can hold indefinitely without overheating under the stated conditions. Peak torque is a short-duration limit. Size continuous loads against rated torque and brief accelerations against peak.

### Does a gearbox increase power?

No. A reduction multiplies torque by the ratio and divides speed by it, and losses mean output power is slightly lower than input power.
