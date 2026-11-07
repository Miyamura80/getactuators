# Tests

## Editorial link checking

The Markdown checker skips root-relative site URLs: it treats them as external
HTTP URLs without a running application and cannot validate routes added in an
unmerged PR. `tests/server/researched-content.test.ts` instead extracts every
root-relative editorial link and image from real rendered HTML and requests it
through the server. Sitemap resolution is also covered by the discovery tests.

One exact external URL is exempted from availability checking: the CyberGear
Chinese-manual mirror on roboticscv.com has an expired TLS certificate at the
October 1, 2026 review. This is not a certificate bypass or proof the link is
healthy. The content visibly discloses its third-party, unauthenticated origin
and reduced provenance confidence. Replace the exemption when a verified,
manufacturer-origin copy becomes available; other external links remain checked.

## Writing tests

Tests are written using `bun:test`. To add a new test, create a `.test.ts` file in the `tests` directory.

```typescript
import { describe, test, expect } from "bun:test";

describe("MyFeature", () => {
    test("should do something", () => {
        expect(true).toBe(true);
    });
});
```

## Running tests

```bash
make test          # Run all tests
make test_fast     # Run with 5s timeout
make test_watch    # Run in watch mode
```

## Server/React SEO regressions

`frontend/tests/seo-content.test.tsx` mounts the real React pages over captured
server markup. `tests/server/agent-pages.test.ts` checks the captures against
current server output and the homepage FAQ JSON-LD, so stale fixtures fail the
backend suite. This keeps the frontend CI job independent of backend packages.
After intentional catalog or rendering changes, install both dependency trees
and regenerate the captures from the repository root:

```bash
bun frontend/tests/capture-seo-pages.ts
bun test
(cd frontend && bun test)
```
