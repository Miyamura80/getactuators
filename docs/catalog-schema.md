# Actuator data schema (v1)

`frontend/src/data/actuators.json` is the canonical catalog: one JSON array of
actuator objects, edited directly. Every server surface and the frontend read it.
Fill every field you can from primary sources (manufacturer datasheet/spec page).
Use `null` when a value is genuinely unknown. **Never fabricate a number.**
Every entry must cite its `sources` (datasheet / product page URLs).

```jsonc
{
  "id": "cubemars-ak80-9",              // kebab-case unique slug
  "name": "AK80-9",                      // model name
  "brand": "CubeMars (T-Motor)",         // manufacturer / brand
  "category": "qdd_proprioceptive",      // one of the category slugs below
  "use_cases": ["quadruped_leg", "robot_arm"], // where builders use it
  "product_url": "https://...",
  "datasheet_url": "https://...",
  "price_usd": 319,                      // approx street price, number or null
  "availability": "in_production",       // in_production | preorder | eol | unknown

  "peak_torque_nm": 18,                  // peak/stall torque at rated voltage
  "rated_torque_nm": 9,                  // continuous/rated torque
  "max_speed_rpm": 475,                  // no-load speed at output
  "gear_ratio": "9:1",                   // string, "1:1" for direct drive
  "weight_g": 485,                       // grams
  "torque_density_nm_per_kg": 37.1,      // peak_torque / (weight_g/1000)
  "backdrivable": true,                  // true | false | null
  "backlash_arcmin": null,               // arcmin (key for arms), or null
  "repeatability_arcmin": null,

  "voltage_v": "24-48",                  // number or range string
  "peak_current_a": 30,
  "power_w": 250,                        // continuous electrical power
  "kt_nm_per_a": null,                   // torque constant if published

  "comm": ["CAN"],                       // CAN | CAN-FD | EtherCAT | RS-485 | TTL | PWM | SPI
  "control_modes": ["position", "velocity", "torque"],
  "encoder": "14-bit absolute",          // type + resolution
  "integrated_driver": true,             // driver/ESC built in?
  "ip_rating": null,                     // e.g. "IP54" or null

  "notes": "Popular MIT-Cheetah-style QDD; needs external CAN adapter.",
  "sources": ["https://...", "https://..."]
}
```

## Category slugs
- `qdd_proprioceptive` - quasi-direct-drive, backdrivable, for legged robots
- `integrated_joint` - integrated servo joint modules (arms/humanoids)
- `smart_servo` - daisy-chainable smart servos (Dynamixel/Feetech class)
- `harmonic_precision` - strain-wave / harmonic-drive precision actuators
- `frameless_driver` - frameless BLDC motor + separate driver/controller
- `cycloidal_premium` - cycloidal / premium high-torque joint actuators

## Rules
- Prefer manufacturer primary sources; note when a spec is a community/measured value.
- Distinguish **peak** vs **continuous** torque; do not mix them.
- Torque values are at the **output shaft** (after the gearbox).
- Compute `torque_density_nm_per_kg` from peak torque and weight when both are known.
- Keep the derived fields in step with their inputs when you edit a row:
  `torque_density_nm_per_kg` (peak torque / kg, 1 dp), `price_per_nm`
  (price / peak torque, 2 dp) and `data_source` (`spot_checked` when
  `verified`, else `web_search`). `tests/data/actuators-integrity.test.ts`
  fails when they drift.
