# Measurement readiness

Status: opt-in measurement is configured in production for public Measurement ID `G-VVX9NFVHF9`. The connected GA4 property is `properties/556916127`, web stream `15933465459`, for `https://actuatorlist.com`. First-party Analytics page-performance reports retrieved October 4, 2026 contain processed page views for October 2–3 (property timezone `Etc/GMT`); this establishes historical page-view ingestion, not delivery of every custom event. Enhanced Measurement remains intentionally disabled. The gallery/dedicated-comparison event extension in this branch is not deployed yet. Custom-event Realtime/DebugView confirmation remains pending authenticated Analytics access; the browser currently reaches Google Sign in. Local event/consent tests are not substitutes for that reporting check.

## Owner activation checklist

1. In your own Google Analytics account, manually create/select a GA4 property and a **Web** data stream for actuatorlist.com. Copy its public measurement ID (the `G-` identifier), not a password, API key or service-account credential. Confirm the correct property and domain.
2. Before enabling the site, disable **Enhanced Measurement** for the stream. In particular, browser-history pageviews, outbound clicks, site search, file downloads and form measurement must not collect additional URLs or duplicate these events. `send_page_view: false` suppresses the config-generated view, **not** Enhanced Measurement history views. Do not add another Google tag, GTM analytics container, advertising destination or cross-domain linker. Leave Google signals and advertising personalization disabled in the property.
3. In Railway's web service **Variables**, set server runtime `GA4_MEASUREMENT_ID` to the real public stream ID, then deploy only after review approval. Leave it unset/empty to keep analytics off. There is no Vite build-time ID, client account key or account credential. Values must match `^G-[A-Z0-9]{6,20}$`; malformed values are ignored rather than interpolated into HTML. To turn off collection on newly loaded pages, remove the variable and redeploy; already open tabs still use their loaded configuration.
4. Complete the consent/network/DebugView checks below with your own real stream before marking measurement active. Property configuration is an activation prerequisite, not something the code can verify remotely.
5. In OpenSEO, sign in to the app and manually connect the intended GA4 property through Integrations. Existing Search Console access does not imply GA4 access. This PR does not sign in, create accounts or change external integrations.

## Consent and data boundaries

The same dependency-free `/measurement.js` bootstrap is injected into recognized HTML SPA, guide, comparison and trust pages. Markdown twins, APIs and 404s do not get it. Docker uses the built public asset; backend-only checkouts fall back to the checked-in public asset. No valid configuration means no banner, preference storage or Google Analytics tag.

Before explicit consent there is no analytics dataLayer, tag request, event queue or analytics cookie. Allow analytics grants only analytics storage, with advertising storage/user data/personalization denied. The Google tag is loaded once; `send_page_view` is false, Google signals and ad personalization are false, and cookies are host-only. Reject keeps the tag unloaded for a fresh visit: this is basic consent gating, not advanced-mode cookieless collection on refusal.

The banner has equally styled Allow analytics and Reject buttons. Analytics preferences stays available to withdraw consent. Only the explicit `granted`/`denied` choice is stored in `actuatorlist.analytics.v1`; blocked storage fails closed on page load and subsequent explicit choices are page-session-only. DNT/GPC suppress analytics even with a saved grant. Rejection in another tab also withdraws. Withdrawal sets Google's disable flag before updating denied consent, drops queued events, and attempts to expire accessible `_ga` / `_ga_*` cookies for current-host and parent-domain/path variants. Other cookies are untouched. Already transmitted data cannot be recalled; HttpOnly, inaccessible paths/domains and public-suffix restrictions remain browser boundaries.

Only actions after consent are queued through the real `gtag` API. No preconsent click history is saved or replayed. Blocked/delayed Google script loading cannot prevent navigation or consent controls from working. Delivery is best effort; beacon transport is requested without delaying native anchors, new tabs or middle-click navigation. Ad blockers, network failures, browser policies and visitors declining analytics mean observed counts are incomplete, not a census.

Page location/referrer and source/destination paths are origin + pathname only (query strings and fragments removed). Page title is a fixed label, not DOM text. Catalog IDs are allowlisted; source/surface values are fixed. There are no search terms, arbitrary anchor text, external URL parameters, user IDs, emails or clipboard values in custom parameters. Comparisons use separate product ID fields to stay within GA parameter-value bounds. Google receives normal network/browser information after opt-in. Existing Google Fonts requests are separate from Analytics and remain documented on the privacy page. This implementation is not a legal compliance guarantee.

## Event dictionary

All custom events include sanitized `source_path`, `page_location`, `page_referrer`, fixed `surface` and beacon transport. Register event-scoped custom dimensions for `product_id`, `surface`, `source_path`, `destination_path`, `tool`, `quantity`, `target` and (if useful) `product_id_1` through `product_id_4`; register `product_count` as a custom metric.

| Event | Trigger | Additional parameters | Interpretation |
| --- | --- | --- | --- |
| `manufacturer_click` | Primary catalog product link in a drawer/product page, or explicitly reviewed primary product source in editorial content | `product_id` | Manufacturer/product research intent, not a sale; inherited catalog product links can be retailers |
| `datasheet_click` | Primary catalog datasheet link or exact reviewed comparative manual link | `product_id` | Engineering research intent; mirrored manuals are source-qualified, not treated as manufacturer domains |
| `compare_open` | Actual Compare control activation with 2–4 distinct selected catalog products on `/all` or `/actuators` | `product_id_1`…`product_id_4`, `product_count` | Comparison engagement, not revenue |
| `compare_update` | User removes a row from an open comparison, leaving 1–3 products | Same ID fields and count | Continued comparison usage; selection toggles and renders do not emit |
| `guide_product_click` | Guide/comparison anchor to its matching known catalog product | `product_id`, sanitized `destination_path` | Editorial contribution to product discovery; ordinary gallery links do not emit |
| `tool_result` | First valid result after the visitor edits an input on `/tools/motor-torque-calculator` or `/tools/robot-arm-torque-calculator`; once per page view. A result already shown at load (defaults or a shared link) does not emit | `tool` (`motor-torque`, `arm-torque`, from the route), `quantity` (`torque`, `power`, `speed`, `holding`) | Tool use. No typed value, unit or result is sent |
| `tool_shortlist_click` | Left or middle click on a tool shortlist product link or its "Compare top N" link | `tool`, `target` (`product` or `compare`), then `product_id`, or `product_id_1`…`product_id_4` and `product_count` | Handoff from a computed requirement into the catalog, not a sale |

Surfaces: `drawer`, `product`, `editorial-source`, `editorial`, `comparison`, `tool`. The humanoid guide's joint shortlists are server-rendered editorial links, so they count as `guide_product_click`. General research citations, source-list links not matching primary catalog URLs and paper links are not automatically promoted to conversion events. The comparative source allowlist is explicit in `src/server/measurement.ts`; extend it deliberately when primary documents change. Catalog link click counts measure intent, not verified purchase/contact completion.

Manual `page_view` sends once on opt-in/current page, then for canonical pathname changes after consent. Query/hash edits, StrictMode renders and duplicate bootstrap executions do not add views. Re-grant on the same page does not replay the prior view. Default GA events such as session start/engagement can still be produced by Google's tag after consent; disabling Enhanced Measurement and real-stream network verification are necessary to audit their payloads.

Recommend marking `manufacturer_click` and `datasheet_click` as key events after validating payloads. Keep compare events as engagement metrics; evaluate `guide_product_click` as a content-assist metric rather than counting it as a purchase. Do not fabricate revenue values or assume every click is a qualified lead.

## Verification

Local checks (no account/real Google delivery required):

```sh
bun test
cd frontend && bun test && bun run build
cd .. && make ci
```

Use the test-only ID fixtures only in automated simulated DOM tests or a local browser with Google tag/collection requests blocked. Never copy them to Railway or send test traffic to a made-up ID. Inspect queued commands to validate behavior, not as evidence of GA ingestion.

With the owner's real stream and consent:

- Clean storage/cookies: check Network for `gtag/js` and Google Analytics collection before a choice, after Reject, with DNT and GPC, and with denied stored preference. There must be no analytics requests/events/cookies. Google Fonts is not an analytics request.
- Allow: exactly one tag load and one manual view with sanitized location/referrer. Use Tag Assistant or Google's debug tooling to enable a DebugView session; this code never enables production-wide debug mode or reads a debug query string.
- Open a drawer, follow both primary links (including Ctrl/Cmd click or middle click); verify one correctly scoped event per action without text or external URLs.
- Select one product: disabled Compare, no compare event. Select two, then Compare: one `compare_open`. Remove a product: `compare_update`. Re-render/selection toggles must not create opens.
- On the standalone guide/comparison, follow a catalog link: `guide_product_click`; paper citations and gallery links must not produce it.
- Change query/hash: no view. Navigate a real SPA path: one sanitized view. Audit all collection requests, including Google's automatically collected events, for unwanted URL fields.
- Withdraw via Analytics preferences: no later site events, GA disable flag true, accessible GA cookies removed, necessary cookies untouched. Check a second tab and delayed/blocked tag. Regrant must not load a second tag or replay old clicks.
- On each calculator, change an input: one `tool_result`; editing again adds none. Click a shortlist product and the compare link: one `tool_shortlist_click` each.
- Verify all seven names and intended parameters in the real property's Realtime/DebugView, then verify reporting/custom dimensions. Save dated screenshots/results separately; until this is done, **delivery is unverified**.

## Weekly Search Console review

Using the already connected Search Console property/OpenSEO access, compare the last complete 7 days with the previous complete 7 days, allowing for reporting lag. Record clicks, impressions, CTR and average position for the entire property and separately `/guides/`, `/comparisons/`, `/actuators/`. Save exact date ranges and compare consistent filters; do not interpret partially reported current days as a drop. Inspect organic landing pages against post-consent GA engagement/key-event counts only after GA4 is connected. Search Console clicks and consented browser sessions have different coverage and should not be expected to match. No automated weekly job or integration has been activated by this change.

## Primary implementation references

- [Google consent setup](https://developers.google.com/tag-platform/security/guides/consent)
- [GA4 configuration fields](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Google event API and DebugView](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [Manual pageviews and Enhanced Measurement history warning](https://developers.google.com/analytics/devguides/collection/ga4/views)
