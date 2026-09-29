# Tests

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
