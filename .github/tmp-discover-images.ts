// Temporary: list candidate product image URLs for actuators without photos.
// Removed before the PR is ready.
const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

const PAGES: Record<string, string[]> = {
    "unitree-m107": ["https://www.unitree.com/h1/", "https://www.unitree.com/mobile/h1"],
    "myactuator-rmd-x8-120": [
        "https://www.robotshop.com/products/myactuator-myactuator-brushless-dc-motor-rmd-x8-120-ethercat-large-torque-120nm-robot-joint-module-large-hollow-planetary-reduction-torque.json",
        "https://www.robotshop.com/products/myactuator-rmd-x-series-bldc-actuator-201-planetary-reduction-ethercat-communication-120-nm-peak-torque.json",
        "https://www.myactuator.com/x8-120details",
        "https://robotdoo.com/products/myactuator-rmd-x8-120-actuator.json",
    ],
    "harmonic-drive-lpa-20": [
        "https://www.harmonicdrive.net/products/integrated-actuators/integrated-actuators/lpa-integrated-servo-drive",
    ],
    "myactuator-rmd-x8-pro-v2": [
        "https://www.robotshop.com/products/my-actuator-rmd-x8-pro-v2-can-bus-bldc-actuator-w-19-reduction-mc-x-300-o-driver.json",
    ],
    "feetech-scs15": [
        "https://www.feetechrc.com/en/scs_ttl_Servo.html",
        "https://aifitlab.com/products/feetech-scs15-servo-motor.json",
        "https://grobotronics.com/servo-robot-17kg.cm-metal-gears-uart-feetech-scs15.html?sl=en",
    ],
    "harmonic-drive-fha-14c-100": [
        "https://www.harmonicdrive.net/products/rotary-actuators/hollow-shaft-servo-actuators/fha-mini",
    ],
    "myactuator-rmd-x6-8": [
        "https://www.robotshop.com/products/myactuator-rmd-x6-v3-can-bus-18-mc-x-300-o-brushless-servo-driver.json",
        "https://ca.robotshop.com/products/myactuator-rmd-x6-v3-can-bus-reduction-ratio-18.json",
        "https://aifitlab.com/products/myactuator-rmd-x6-8-motor.json",
    ],
    "myactuator-rmd-l-9015": [
        "https://us.amazon.com/MyActuator-RMD-L-9015-16T-Closed-Loop-Brushless-Turntable/dp/B0CCYHDR1N",
        "https://uk.robotshop.com/products/myactuator-rmd-l-9015-35t-bldc-can-bus-servo.json",
        "https://rcdrone.top/products/myactuator-l-9015-direct-drive-bldc-servo-motor.json",
    ],
    "spinea-drivespin-ds110": ["https://www.spinea.com/en/products/drivespin/standard/ds110"],
    "atar-arc-cycloidal-joint": [
        "https://www.atarrobot.com/cycloidal-robot/arc-serie/Arc-cycloidal-joint-actuators.html",
    ],
    "maxon-ec-frameless-90-flat-260w": ["https://www.maxongroup.com/maxon/view/product/542099"],
    "trampa-vesc-6-mkvi": ["https://trampa.co.uk/product/vesc6-mk6/"],
    "trinamic-tmc4671": ["https://www.analog.com/en/products/tmc4671.html"],
    "harmonic-drive-sha-cg": [
        "https://www.harmonicdrive.net/products/rotary-actuators/hollow-shaft-servo-actuators/sha-cg",
    ],
    "myactuator-rmd-x10-s2-v3": [
        "https://www.myactuator.com/x10-100-details",
        "https://ca.robotshop.com/products/myactuator-rmd-x10-s2-v3-bldc-can-bus.json",
    ],
};

function attr(tag: string, name: string): string | null {
    const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']+)["']`, "i"));
    return m?.[1] ?? null;
}

async function scan(id: string, url: string): Promise<void> {
    try {
        const res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "text/html,application/json,*/*" },
            redirect: "follow",
            signal: AbortSignal.timeout(30_000),
        });
        const text = await res.text();
        console.log(`\n### ${id} ${res.status} ${url}`);
        if (url.endsWith(".json")) {
            try {
                const product = JSON.parse(text).product;
                console.log(`TITLE ${product.title}`);
                for (const img of product.images ?? []) console.log(`SHOPIFY ${img.src} | ${img.alt ?? ""}`);
            } catch {
                console.log(`BADJSON ${text.slice(0, 200)}`);
            }
            return;
        }
        const seen = new Set<string>();
        for (const tag of text.match(/<meta[^>]+>/gi) ?? []) {
            const key = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
            if (key.includes("image")) console.log(`META ${key} ${attr(tag, "content")}`);
        }
        for (const tag of text.match(/<(img|source)[^>]+>/gi) ?? []) {
            for (const a of ["src", "data-src", "data-original", "data-lazy-src", "srcset", "data-srcset"]) {
                const v = attr(tag, a);
                if (!v || v.startsWith("data:")) continue;
                const first = (v.split(",")[0] ?? "").trim().split(" ")[0] ?? "";
                let abs = first;
                try {
                    abs = new URL(first, res.url || url).toString();
                } catch {}
                if (seen.has(abs)) continue;
                seen.add(abs);
                console.log(`IMG ${abs} | ${attr(tag, "alt") ?? ""}`);
            }
        }
        const bg = text.match(/https?:\/\/[^"'()\s]+\.(?:jpe?g|png|webp)/gi) ?? [];
        for (const u of bg) {
            if (seen.has(u)) continue;
            seen.add(u);
            console.log(`RAW ${u}`);
        }
    } catch (err) {
        console.log(`\n### ${id} ERROR ${url} ${(err as Error).message}`);
    }
}

for (const [id, urls] of Object.entries(PAGES)) {
    for (const url of urls) await scan(id, url);
}
