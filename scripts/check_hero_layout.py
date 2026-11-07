"""Optional real-Chromium regression; no application/CI dependency additions.

Usage: python scripts/check_hero_layout.py http://127.0.0.1:4312 OUTPUT_DIR
Requires Python Playwright and its Chromium browser installed separately.
All remote HTTPS requests are blocked; run the preview without a GA4 ID.
"""

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

WIDTHS = [1280, 1180, 1100, 1024, 960, 900, 860, 768, 640, 560, 390, 320]
MEASURE = """() => {
    const box = selector => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return {left:r.left, right:r.right, top:r.top, bottom:r.bottom,
                width:r.width, height:r.height};
    };
    const cv = document.querySelector('.hero-art canvas');
    return {
        hero:box('.hero'), main:box('.hero-main'), heading:box('.hero h1'),
        art:box('.hero-art'), canvas:box('.hero-art canvas'),
        highlights:box('.block'), backing:[cv.width, cv.height],
        label:cv.getAttribute('aria-label'), labels:window.heroLabels,
        viewport:{inner:innerWidth, client:document.documentElement.clientWidth,
                  scroll:document.documentElement.scrollWidth,
                  visual:visualViewport.width},
        font:parseFloat(getComputedStyle(document.querySelector('.hero h1')).fontSize)
    };
}"""
# Observe actual drawing, leaving Canvas methods and arguments unchanged.
DRAW_PROBE = """(() => {
    window.heroLabels = {};
    window.heroPaints = 0;
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function(text, x, y, ...args) {
        if (this.canvas.closest('.hero-art')) {
            const t = this.getTransform(), m = this.measureText(text);
            window.heroLabels[text] = {
                left:t.a * (x - m.actualBoundingBoxLeft) + t.e,
                right:t.a * (x + m.actualBoundingBoxRight) + t.e,
                top:t.d * (y - m.actualBoundingBoxAscent) + t.f,
                bottom:t.d * (y + m.actualBoundingBoxDescent) + t.f,
                width:this.canvas.width, height:this.canvas.height
            };
            if (text === 'HOUSING') window.heroPaints++;
        }
        return original.call(this, text, x, y, ...args);
    };
})()"""


def validate(bounds, width, dpr):
    errors = []
    art, heading = bounds["art"], bounds["heading"]
    if bounds["hero"]["width"] > 580:
        if art["left"] < heading["right"] - 1 or art["top"] >= heading["bottom"]:
            errors.append("animation must be RIGHT of headline in same hero row")
        if art["width"] < 270:
            errors.append("diagram too small")
        if bounds["hero"]["height"] > 450:
            errors.append("side-by-side hero leaves excessive vertical space")
    elif art["top"] < bounds["main"]["bottom"] - 1:
        errors.append("narrow hero must stack")
    viewport = bounds["viewport"]
    if (viewport["scroll"] > viewport["client"] + 1
            or abs(viewport["inner"] - width) > 1
            or abs(viewport["visual"] - width) > 1):
        errors.append("document/visual viewport horizontal overflow")
    if (art["right"] > bounds["hero"]["right"] + 1
            or heading["right"] > bounds["hero"]["right"] + 1):
        errors.append("hero bounds overflow")
    if (abs(bounds["backing"][0] - round(bounds["canvas"]["width"] * dpr)) > 2
            or abs(bounds["backing"][1] - round(bounds["canvas"]["height"] * dpr)) > 2):
        errors.append("canvas backing store must match its CSS size and DPR")
    if not bounds["label"] or "planetary" not in bounds["label"]:
        errors.append("accessible canvas label missing")
    labels = bounds["labels"]
    if set(labels) != {"HOUSING", "STATOR", "ROTOR", "PLANETARY", "OUTPUT FLANGE"}:
        errors.append("all five component labels must be painted")
    for name, label in labels.items():
        if (label["left"] < 0 or label["right"] > label["width"]
                or label["top"] < 0 or label["bottom"] > label["height"]):
            errors.append(f"clipped canvas label: {name}")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url")
    parser.add_argument("out", type=Path)
    parser.add_argument("--widths", nargs="+", type=int, default=WIDTHS)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    rows = []
    browser_errors = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, args=["--no-sandbox"])

        def open_page(dpr, mobile=False, motion="reduce"):
            context = browser.new_context(
                device_scale_factor=dpr, is_mobile=mobile, reduced_motion=motion,
                viewport={"width": 390 if mobile else 1280, "height": 1000},
            )
            context.route("https://**/*", lambda route: route.abort())
            context.add_init_script(DRAW_PROBE)
            page = context.new_page()
            page.on("pageerror", lambda error: browser_errors.append(str(error)))
            page.goto(args.url)
            page.wait_for_selector(".hero-art canvas")
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(200)
            return context, page

        def record(page, width, dpr, scenario):
            bounds = page.evaluate(MEASURE)
            rows.append({"width": width, "dpr": dpr, "scenario": scenario,
                         "bounds": bounds, "errors": validate(bounds, width, dpr)})

        for dpr in [1, 2]:
            context, page = open_page(dpr)
            for width in args.widths:
                page.set_viewport_size({"width": width, "height": 1000})
                page.wait_for_timeout(200)
                record(page, width, dpr, "viewport resize")
                if dpr == 1 and width in [1100, 1024, 900, 768, 390]:
                    page.screenshot(path=str(args.out / f"{width}-full.png"), full_page=True)
                    page.locator(".hero").screenshot(path=str(args.out / f"{width}-hero.png"))
            page.set_viewport_size({"width": 1280, "height": 1000})
            page.wait_for_timeout(200)
            # No window resize: verifies container-driven layout and pixel sizing.
            for content_width in [844, 636, 600, 844]:
                page.locator(".content").evaluate(
                    "(el, width) => el.style.width = width + 'px'", content_width)
                page.wait_for_timeout(200)
                record(page, 1280, dpr, f"container-only resize {content_width}px")
            paints = page.evaluate("window.heroPaints")
            page.wait_for_timeout(300)
            if page.evaluate("window.heroPaints") != paints:
                browser_errors.append("reduced motion keeps repainting after layout settles")
            context.close()

        context, page = open_page(2, mobile=True)
        for width in [390, 320]:
            page.set_viewport_size({"width": width, "height": 1000})
            page.wait_for_timeout(200)
            record(page, width, 2, "mobile visual viewport")
        context.close()

        context, page = open_page(1, motion="no-preference")
        first = page.locator("canvas[role=img]").evaluate("cv => cv.toDataURL()")
        page.wait_for_timeout(200)
        second = page.locator("canvas[role=img]").evaluate("cv => cv.toDataURL()")
        if first == second:
            browser_errors.append("normal motion does not animate")
        record(page, 1280, 1, "normal animation")
        page.emulate_media(reduced_motion="reduce")
        page.wait_for_timeout(200)
        first = page.locator("canvas[role=img]").evaluate("cv => cv.toDataURL()")
        paints = page.evaluate("window.heroPaints")
        page.wait_for_timeout(300)
        second = page.locator("canvas[role=img]").evaluate("cv => cv.toDataURL()")
        if first != second or page.evaluate("window.heroPaints") != paints:
            browser_errors.append("reduced-motion change does not stop animation")
        page.emulate_media(reduced_motion="no-preference")
        page.evaluate("scrollTo(0, document.documentElement.scrollHeight)")
        page.wait_for_timeout(300)
        paints = page.evaluate("window.heroPaints")
        page.wait_for_timeout(300)
        if page.evaluate("window.heroPaints") != paints:
            browser_errors.append("offscreen animation does not pause")
        page.evaluate("scrollTo(0, 0)")
        page.wait_for_timeout(300)
        if page.evaluate("window.heroPaints") <= paints:
            browser_errors.append("visible animation does not resume")
        context.close()
        browser.close()
    (args.out / "bounds.json").write_text(json.dumps(rows, indent=2))
    failures = [{"width": row["width"], "dpr": row["dpr"],
                 "scenario": row["scenario"], "errors": row["errors"]}
                for row in rows if row["errors"]]
    summary = {"cases": len(rows), "failed": len(failures),
               "failures": failures, "browser_errors": browser_errors}
    (args.out / "summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))
    raise SystemExit(bool(failures or browser_errors))


if __name__ == "__main__":
    main()
