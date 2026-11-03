import {
    type CountryPage,
    LIVE_COUNTRY_PAGES,
    getCountryPage,
} from "@/supply-chain/country-pages";
import {
    countryListOut,
    countryListView,
    countryOut,
    countryView,
} from "@/supply-chain/country-pages/views";
import type { z } from "zod";
import { type ApiContext, json } from "./http";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/countries: the country pages (/japan, ...) over REST. Same wire
// shape as the MCP tool get_country.

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

export const CountryListSchema = named("CountryList", countryListOut);
export const CountrySchema = named("Country", countryOut);

export function listCountriesHandler(): Response {
    return json(countryListView());
}

// The live country page named by `:code` (code or slug, any case), or a 404.
export function findCountry({ params }: ApiContext): CountryPage {
    const code = params.code ?? "";
    const page = getCountryPage(code);
    if (!page)
        throw new ApiError("not_found", {
            detail: `No live country page "${code}". Live: ${LIVE_COUNTRY_PAGES.map((p) => p.code).join(", ")}.`,
            hint: "List live countries with GET /api/v1/countries.",
        });
    return page;
}

export function getCountryHandler(ctx: ApiContext): Response {
    return json(countryView(findCountry(ctx)));
}
