# Hero browser regression

`check_hero_layout.py` is an optional real-Chromium layout regression, not a new
application or CI dependency. Happy DOM cannot verify these CSS bounds.

## Run against a local production build

From the repository root, with Bun dependencies already installed:

```sh
(cd frontend && bun run build)
env -u GA4_MEASUREMENT_ID bun -e 'import {startServer} from "./src/server/app.ts"; await startServer(4312)'
```

In another terminal, with Python Playwright and Chromium installed separately:

```sh
python scripts/check_hero_layout.py http://127.0.0.1:4312 /path/to/hero-evidence
```

If needed, install the browser tooling in a separate environment, rather than
adding it to the application's dependencies:

```sh
python -m venv /path/to/browser-tools
/path/to/browser-tools/bin/pip install playwright
/path/to/browser-tools/bin/python -m playwright install chromium
/path/to/browser-tools/bin/python scripts/check_hero_layout.py http://127.0.0.1:4312 /path/to/hero-evidence
```

Restart the preview server after rebuilding: its HTML shell is cached. Stop the
server after verification. Keep `GA4_MEASUREMENT_ID` unset; the browser script
also blocks remote HTTPS requests, including analytics and webfonts. Screenshots
therefore use the site's system-font fallbacks consistently.

## Assertions and evidence

- Available hero content above 580 CSS pixels: animation to the right of the
  heading, overlapping its vertical region; substantial diagram width and
  compact hero height. Narrow content stacks without horizontal overflow.
- Viewports 1280, 1180, 1100, 1024, 960, 900, 860, 768, 640, 560, 390 and 320,
  at DPR 1 and 2, including live resizing through the sidebar breakpoint.
- Container-only resizing without a window event, including crossing the hero
  stacking boundary; backing dimensions match CSS size and DPR.
- Separate mobile visual-viewport checks, all five canvas labels inside the
  backing store, and the descriptive accessible canvas label.
- Normal animation changes pixels, reduced motion stops painting, offscreen
  animation pauses, and visible animation resumes. Browser page errors fail.

The command exits nonzero on regression and writes `bounds.json`, `summary.json`,
and matched full-page and hero PNGs at selected widths. Reduced web-content
widths exercise the effect of browser vertical tabs; this does not inspect or
claim to reproduce Chrome's tab UI.

For before/after comparisons, build an explicit baseline commit in an isolated
worktree, serve it on a second port with analytics unset, then run the same script
against both ports with distinct output directories. The original flex-wrapped
hero fails the side-by-side assertions; viewport resize alone did not cover the
container-only canvas backing-size failure.
