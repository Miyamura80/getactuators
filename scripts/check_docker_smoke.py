"""Smoke the built production image; run against a locally published container."""
import json
import re
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

# Expected gallery counts come from the catalog, so data changes do not break the smoke.
rows = json.loads((Path(__file__).resolve().parent.parent / "frontend/src/data/actuators.json").read_text())
with_photo = sum(1 for row in rows if row.get("image_url"))

base = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://127.0.0.1:3000"
for attempt in range(40):
    try:
        with urlopen(base + "/", timeout=2) as response:
            home = response.read().decode()
        break
    except (URLError, TimeoutError, ConnectionError):
        if attempt == 39:
            raise
        time.sleep(0.5)


def get(path):
    with urlopen(base + path, timeout=10) as response:
        assert response.status == 200, (path, response.status)
        return response.read().decode(), response.headers


assert 'class="ga-faq-item"' not in home, "Homepage still includes FAQ answers"
faq, _ = get("/faq")
assert faq.count('<details class="ga-faq-item">') == 7, "Missing FAQ disclosures"
assert 'rel="canonical" href="https://actuatorlist.com/faq"' in faq
assert "Frequently asked questions" in get("/faq.md")[0]
assert "Frequently asked questions" not in get("/index.md")[0]
assert "https://actuatorlist.com/faq" in get("/sitemap.xml")[0]
assert 'data-ga4-id' not in home, "Analytics must default off in smoke image"
assets = re.findall(r'src="(/assets/[^" ]+\.js)"', home)
assert assets, "No production application bundle"
for asset in assets:
    bundle, _ = get(asset)
    assert "alpha-tag" in bundle, "Missing current sidebar UI"
    assert "hero-content" in get(re.search(r'href="(/assets/[^" ]+\.css)"', home).group(1))[0]
gallery, _ = get("/actuators")
assert 'rel="preload" as="image" href="/actuator-images/nabtesco-rv-42n.webp"' in gallery
# These are raw HTTP bytes, before the application bundle can run.
assert 'data-gallery-prerender="true"' in gallery, "Missing gallery hydration marker"
assert gallery.count('class="bento-card"') == len(rows), "Missing initial gallery cards"
photos = re.findall(r'<img\b[^>]*class="actuator-photo"[^>]*>', gallery)
assert len(photos) == with_photo, "Missing initial gallery product photos"
assert sum('loading="eager"' in photo and 'fetchPriority="high"' in photo for photo in photos) == 1
assert sum('loading="lazy"' in photo and 'decoding="async"' in photo for photo in photos) == with_photo - 1
assert len(re.findall(r'<link\b[^>]*rel="preload"[^>]*as="image"', gallery)) == 1, "Duplicate gallery preload"
with urlopen(base + "/actuator-images/nabtesco-rv-42n.webp", timeout=10) as response:
    assert response.status == 200 and response.headers.get_content_type() == "image/webp"
    assert response.read(), "Empty leading gallery photo"
assert get("/actuators/cubemars-ak80-9")[0].find("Specifications") >= 0
assert "actuatorlist.analytics.v1" in get("/measurement.js")[0]
assert 'class="site-footer"' in home and 'class="site-header"' in home
try:
    get("/not-a-real-route-smoke-test")
    raise AssertionError("Unknown route returned 200")
except HTTPError as error:
    assert error.code == 404, error.code
print(f"Production Docker smoke passed: startup, homepage/FAQ, built JS/CSS, initial gallery ({len(rows)} cards/{with_photo} photos, one preload), product, measurement asset, Markdown and genuine 404.")
