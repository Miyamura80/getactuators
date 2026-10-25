import { z } from "zod";
import { SEGMENTS } from "./companies";
import { COUNTRY_CODES, type CountryCode } from "./countries";
import { SITE_KINDS, SITE_STATUSES } from "./sites";
import { CONFIDENCES } from "./sourced";
import { SOURCE_KINDS } from "./sources";
import { STAGES } from "./stages";

// Zod schemas for every registry record, kept apart from the data so the
// browser bundle imports the data without zod. The registry tests and
// scripts/citation-audit.ts parse each dataset with these.

export const asOfSchema = z
    .string()
    .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, "asOf must be YYYY, YYYY-MM or YYYY-MM-DD");

export function sourcedSchema<T extends z.ZodType>(value: T) {
    return z.object({
        value,
        unit: z.string().min(1).optional(),
        sources: z.array(z.string().min(1)).min(1),
        asOf: asOfSchema,
        confidence: z.enum(CONFIDENCES),
        note: z.string().min(1).optional(),
        range: z.tuple([value, value]).optional(),
    });
}

export const sourcedNumberSchema = sourcedSchema(z.number().finite());

export const sourceRefSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    title: z.string().min(1),
    publisher: z.string().min(1),
    url: z.url(),
    accessed: z.iso.date(),
    kind: z.enum(SOURCE_KINDS),
    paywalled: z.boolean().optional(),
});

export const companySchema = z.object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    name: z.string().min(1),
    localName: z.string().min(1).optional(),
    hqCountry: z.enum(COUNTRY_CODES as [CountryCode, ...CountryCode[]]),
    stages: z.array(z.enum(STAGES)).min(1),
    segment: z.enum(SEGMENTS),
    ownership: z
        .object({
            kind: z.enum(["listed", "private", "state", "subsidiary"]),
            ticker: z.string().min(1).optional(),
            parent: z.string().min(1).optional(),
        })
        .optional(),
    revenue: sourcedNumberSchema.optional(),
    grossMargin: sourcedNumberSchema
        .refine((s) => s.value >= 0 && s.value <= 1, "gross margin is a fraction")
        .optional(),
    products: z.array(z.string().min(1)).optional(),
    url: z.url(),
    sources: z.array(z.string().min(1)).min(1).optional(),
});

export const siteSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    companyId: z.string().min(1),
    kind: z.enum(SITE_KINDS),
    name: z.string().min(1),
    country: z.enum(COUNTRY_CODES as [CountryCode, ...CountryCode[]]),
    admin1: z.string().min(1).optional(),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    precision: z.enum(["site", "city", "region"]),
    makes: z.array(z.string().min(1)).optional(),
    stages: z.array(z.enum(STAGES)),
    capacity: sourcedNumberSchema.optional(),
    opened: sourcedNumberSchema.optional(),
    status: z.enum(SITE_STATUSES).optional(),
    sources: z.array(z.string().min(1)).min(1),
});

export const supplyLinkSchema = z.object({
    from: z.string().min(1),
    to: z.string().min(1),
    what: z.string().min(1),
    sources: z.array(z.string().min(1)).min(1),
    confidence: z.enum(CONFIDENCES),
    note: z.string().min(1).optional(),
});
