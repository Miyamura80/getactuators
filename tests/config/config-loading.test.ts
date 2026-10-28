import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createConfig } from "@/config/loader";

describe("Config Loading", () => {
    test("loads config from YAML successfully", () => {
        const config = createConfig();
        expect(config.exampleParent.exampleChild).toBe("example_value");
        expect(typeof config.devEnv).toBe("string");
    });

    test("has logging config", () => {
        const config = createConfig();
        expect(config.logging.verbose).toBe(true);
        expect(config.logging.levels.info).toBe(true);
        expect(config.logging.levels.debug).toBe(false);
    });

    test("has redaction patterns", () => {
        const config = createConfig();
        expect(config.logging.redaction.enabled).toBe(true);
        expect(config.logging.redaction.patterns.length).toBeGreaterThan(0);
    });

    test("has feature flags", () => {
        const config = createConfig();
        expect(config.features.newUi).toBe(false);
        expect(config.features.betaFeatures).toBe(false);
    });

    test("sets runtime fields", () => {
        const config = createConfig();
        expect(typeof config.isLocal).toBe("boolean");
        expect(typeof config.runningOn).toBe("string");
    });
});

describe("Config Env Var Override", () => {
    const savedEnv: Record<string, string | undefined> = {};

    beforeEach(() => {
        savedEnv.EXAMPLE_PARENT__EXAMPLE_CHILD =
            process.env.EXAMPLE_PARENT__EXAMPLE_CHILD;
        savedEnv.FEATURES__NEW_UI = process.env.FEATURES__NEW_UI;
    });

    afterEach(() => {
        for (const [key, value] of Object.entries(savedEnv)) {
            if (value === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = value;
            }
        }
    });

    test("env vars override nested YAML values", () => {
        process.env.EXAMPLE_PARENT__EXAMPLE_CHILD = "overridden";
        const config = createConfig();
        expect(config.exampleParent.exampleChild).toBe("overridden");
    });

    test("env vars override feature flags", () => {
        process.env.FEATURES__NEW_UI = "true";
        const config = createConfig();
        expect(config.features.newUi).toBe(true);
    });
});
