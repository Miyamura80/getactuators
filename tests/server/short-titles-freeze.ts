import { mock } from "bun:test";
import actuators from "./short-titles-catalog.json";
import robots from "./short-titles-robots.json";

// Preload for the golden content check in short-titles.test.ts: serve the
// catalog as it stood when the golden hashes were captured, so later data
// edits never need the hashes regenerated or reversed.
mock.module("../../frontend/src/data/actuators.json", () => ({ default: actuators }));
mock.module("../../frontend/src/data/robots.json", () => ({ default: robots }));
