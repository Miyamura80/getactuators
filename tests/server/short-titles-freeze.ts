import { mock } from "bun:test";
import actuators from "./short-titles-frozen-actuators.json";
import robots from "./short-titles-frozen-robots.json";

// Preload for short-titles-golden.ts: serve the catalog as it stood when the
// golden metadata was captured, so data edits need neither a regenerated baseline
// nor revert logic in the test. Never edit the frozen copies.
// Paths are relative to this file and must name the same files that
// src/catalog/index.ts imports, or the real data is served instead.
mock.module("../../frontend/src/data/actuators.json", () => ({ default: actuators }));
mock.module("../../frontend/src/data/robots.json", () => ({ default: robots }));
