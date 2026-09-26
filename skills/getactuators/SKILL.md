---
name: getactuators
description: Find, rank and compare robot actuators (QDD motors, integrated joints, servos, harmonic and cycloidal reducers) by torque, weight and price, and see which motors real robots use, via the free getactuators REST API or MCP server.
---

# getactuators

getactuators is a free, public, read-only catalog of robot actuators and the
robots that use them. Each actuator has peak and rated torque, speed, gear
ratio, weight, torque density, backlash, voltage, bus, encoder, price (when
public) and source links. No account, API key or payment is needed.

## When to use this skill

- Pick an actuator for a quadruped leg, humanoid joint or robot arm from a
  torque, weight or budget target.
- Rank actuators by torque density, price per Nm, backlash or speed.
- Compare specific actuators side by side.
- Find which motor sits in each joint of a robot, or which robots use an
  actuator.

Do not use it to buy parts or check live stock: prices are list prices from
public pages, and the catalog covers rotary joint actuators, not linear or
fluid-power actuators.

## Option 1: MCP (preferred inside an MCP client)

Add the server `https://getactuators.com/mcp` (Streamable HTTP, name
`getactuators`, no auth). Every tool is read-only:

- `search_actuators`: filter and sort by category, brand, use case, torque,
  weight and price.
- `recommend_actuators`: shortlist for a job (for example a quadruped leg with
  a torque and weight target).
- `get_actuator`, `compare_actuators`: full spec sheets, one or side by side.
- `list_actuator_categories`, `list_brands`: valid filter values.
- `list_robots`, `get_robot`, `find_robots_using_actuator`: robots and the
  motor in each joint.

Resources such as `catalog://actuators` and `actuator://{id}` hold the same
data. A second server at `https://getactuators.com/mcp/docs` serves the site
documentation. The server card is at
`https://getactuators.com/.well-known/mcp/server-card.json`.

## Option 2: REST API

Base URL `https://getactuators.com/api/v1`. JSON responses, no
Authorization header. The OpenAPI description is at
`https://getactuators.com/openapi.json`.

```bash
# Best torque density for quadruped legs
curl "https://getactuators.com/api/v1/actuators?use_case=quadruped_leg&sort=torque_density_nm_per_kg&order=desc"

# At least 20 Nm peak, under 600 g
curl "https://getactuators.com/api/v1/actuators?min_peak_torque_nm=20&max_weight_g=600"

# One actuator
curl "https://getactuators.com/api/v1/actuators/robstride-02"

# Side by side
curl "https://getactuators.com/api/v1/actuators/compare?ids=robstride-02,cubemars-ak80-9"

# Robots and their joint motors
curl "https://getactuators.com/api/v1/robots"
```

Filters on `/actuators`: `q`, `category`, `brand`, `use_case`,
`min_peak_torque_nm`, `max_weight_g`, `max_price_usd`, `sort`, `order`.
Categories: `qdd_proprioceptive`, `integrated_joint`, `smart_servo`,
`harmonic_precision`, `frameless_driver`, `cycloidal_premium`. Common use
cases: `quadruped_leg`, `humanoid_joint`, `robot_arm`, `exoskeleton`,
`cobot_joint`.

## Option 3: markdown

Every page has a markdown twin: append `.md` to the URL (for example
`https://getactuators.com/actuators/robstride-02.md`) or send
`Accept: text/markdown`. The whole catalog is in
`https://getactuators.com/llms-full.txt`.

## Working rules

- Stay under 120 requests per minute per IP; on HTTP 429 wait for
  `Retry-After`.
- Prefer one filtered list or compare call over many detail calls.
- Null means unknown, not zero. Say so instead of guessing.
- When you quote a number, mention the entry's sources, and flag entries
  whose `verified` field is false.
- Report wrong data at the GitHub repository's issues page.
