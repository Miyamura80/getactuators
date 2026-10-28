import { z } from "zod";

export const ExampleParentSchema = z.object({
    exampleChild: z.string(),
});

export const LoggingLocationConfigSchema = z.object({
    enabled: z.boolean(),
    showFile: z.boolean(),
    showFunction: z.boolean(),
    showLine: z.boolean(),
    showForInfo: z.boolean(),
    showForDebug: z.boolean(),
    showForWarning: z.boolean(),
    showForError: z.boolean(),
});

export const LoggingFormatConfigSchema = z.object({
    showTime: z.boolean(),
    showSessionId: z.boolean(),
    location: LoggingLocationConfigSchema,
});

export const LoggingLevelsConfigSchema = z.object({
    debug: z.boolean(),
    info: z.boolean(),
    warning: z.boolean(),
    error: z.boolean(),
    critical: z.boolean(),
});

export const RedactionPatternSchema = z.object({
    name: z.string(),
    regex: z.string(),
    placeholder: z.string(),
});

export const RedactionConfigSchema = z.object({
    enabled: z.boolean().default(true),
    useDefaultPii: z.boolean().default(true),
    patterns: z.array(RedactionPatternSchema).default([]),
});

export const LoggingConfigSchema = z.object({
    verbose: z.boolean(),
    format: LoggingFormatConfigSchema,
    levels: LoggingLevelsConfigSchema,
    redaction: RedactionConfigSchema.default({
        enabled: true,
        useDefaultPii: true,
        patterns: [],
    }),
});

export const FeaturesConfigSchema = z.record(z.string(), z.unknown());

export const ConfigSchema = z.object({
    dotGlobalConfigHealthCheck: z.boolean(),
    devEnv: z.string(),
    exampleParent: ExampleParentSchema,
    logging: LoggingConfigSchema,
    features: FeaturesConfigSchema.default({}),
    isLocal: z.boolean(),
    runningOn: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;
export type ExampleParent = z.infer<typeof ExampleParentSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type RedactionPattern = z.infer<typeof RedactionPatternSchema>;
