"""Smoke the built production image; run against a locally published container."""
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

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


assert home.count('<details class="ga-faq-item">') == 7, "Missing FAQ disclosures"
assert 'data-ga4-id' not in home, "Analytics must default off in smoke image"
assets = re.findall(r'src="(/assets/[^" ]+\.js)"', home)
assert assets, "No production application bundle"
for asset in assets:
    bundle, _ = get(asset)
    assert "alpha-tag" in bundle, "Missing current sidebar UI"
    assert "hero-content" in get(re.search(r'href="(/assets/[^" ]+\.css)"', home).group(1))[0]
gallery, _ = get("/actuators")
assert 'rel="preload" as="image" href="/actuator-images/nabtesco-rv-42n.webp"' in gallery
assert get("/actuators/cubemars-ak80-9")[0].find("Specifications") >= 0
assert "actuatorlist.analytics.v1" in get("/measurement.js")[0]
assert "Frequently asked questions" in get("/index.md")[0]
try:
    get("/not-a-real-route-smoke-test")
    raise AssertionError("Unknown route returned 200")
except HTTPError as error:
    assert error.code == 404, error.code
print("Production Docker smoke passed: startup, homepage/FAQ, built JS/CSS, gallery preload, product, measurement asset, Markdown and genuine 404.")
