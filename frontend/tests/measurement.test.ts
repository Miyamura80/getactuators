import { expect, test } from "bun:test";
import { Window } from "happy-dom";

const source = () => Bun.file(`${import.meta.dir}/../public/measurement.js`).text();
async function browser(options: { referrer?: string; consent?: string; dnt?: string; gpc?: boolean; storageFails?: boolean; id?: string } = {}) {
    const window = new Window({ url: "https://actuatorlist.com/all?q=private#secret", settings: { disableJavaScriptFileLoading: true, disableCSSFileLoading: true } });
    window.document.body.innerHTML = '<main>Catalog</main>';
    const script = window.document.createElement("script");
    script.dataset.ga4Id = options.id ?? "G-TEST123456";
    script.dataset.products = "cubemars-ak80-9,xiaomi-cybergear";
    window.document.head.append(script);
    Object.defineProperty(window.document, "currentScript", { value: script });
    if (options.referrer !== undefined) Object.defineProperty(window.document, "referrer", { value: options.referrer });
    Object.defineProperty(window.navigator, "doNotTrack", { value: options.dnt });
    Object.defineProperty(window.navigator, "globalPrivacyControl", { value: options.gpc });
    if (options.consent) window.localStorage.setItem("actuatorlist.analytics.v1", options.consent);
    if (options.storageFails) Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
    window.eval(await source());
    return window;
}
function click(window: Window, label: string) {
    const button = [...window.document.querySelectorAll("button")].find((b) => b.textContent === label);
    expect(button).toBeDefined();
    button?.click();
}
function commands(window: Window): unknown[][] {
    return (window as unknown as { dataLayer?: ArrayLike<unknown>[] }).dataLayer?.map((a) => Array.from(a)) ?? [];
}
test("bootstrap makes no Google request or events until explicit opt-in, then sanitized one page view", async () => {
    const w = await browser();
    expect(w.document.querySelector('[src*="googletagmanager"]')).toBeNull();
    expect(commands(w)).toEqual([]);
    click(w, "Allow analytics");
    expect(w.document.querySelectorAll('[src*="googletagmanager"]')).toHaveLength(1);
    expect(commands(w).filter((c) => c[0] === "event")).toEqual([["event", "page_view", expect.objectContaining({ page_location: "https://actuatorlist.com/all" })]]);
    w.eval(await source());
    expect(w.document.querySelectorAll('[src*="googletagmanager"]')).toHaveLength(1);
    expect(commands(w).filter((c) => c[0] === "event")).toHaveLength(1);
    await w.happyDOM.close();
});
test("denial, DNT and GPC never initialize analytics even with stored grant", async () => {
    for (const options of [{ consent: "denied" }, { consent: "granted", dnt: "1" }, { consent: "granted", gpc: true }]) {
        const w = await browser(options);
        expect(w.document.querySelector('[src*="googletagmanager"]')).toBeNull();
        expect(commands(w)).toEqual([]);
        if (options.dnt || options.gpc) expect(w.document.querySelector("#analytics-banner")).toBeNull();
        else expect(w.document.querySelector("#analytics-banner")?.hasAttribute("hidden")).toBe(true);
        await w.happyDOM.close();
    }
});
test("stored explicit grant resumes; rejection withdraws, disables tag, clears GA cookies and pending queue", async () => {
    const w = await browser({ consent: "granted" });
    expect(w.document.querySelector('[src*="googletagmanager"]')).not.toBeNull();
    w.document.cookie = "_ga=123; path=/";
    w.document.cookie = "_ga_TEST123456=456; path=/";
    w.document.cookie = "necessary=keep; path=/";
    click(w, "Analytics preferences");
    click(w, "Reject");
    expect((w as unknown as Record<string, unknown>)["ga-disable-G-TEST123456"]).toBe(true);
    expect(w.document.cookie).toBe("necessary=keep");
    expect(w.localStorage.getItem("actuatorlist.analytics.v1")).toBe("denied");
    expect(commands(w).filter((c) => c[0] === "event")).toHaveLength(0);
    expect(commands(w).filter((c) => c[0] === "config")).toHaveLength(1);
    await w.happyDOM.close();
});
test("unavailable preference storage fails closed, but explicit session grant is allowed", async () => {
    const w = await browser({ storageFails: true });
    expect(commands(w)).toEqual([]);
    click(w, "Allow analytics");
    expect(commands(w).filter((c) => c[0] === "event")).toHaveLength(1);
    click(w, "Analytics preferences"); click(w, "Reject");
    expect((w as unknown as Record<string, unknown>)["ga-disable-G-TEST123456"]).toBe(true);
    await w.happyDOM.close();
});
test("unconfigured bootstrap has no banner or storage mutation", async () => {
    const w = await browser({ id: 'G-bad<script>' });
    expect(w.document.querySelector("#analytics-banner")).toBeNull();
    expect(w.localStorage.length).toBe(0);
    expect(commands(w)).toEqual([]);
    await w.happyDOM.close();
});
function link(w: Window, event: string, id = "cubemars-ak80-9", surface = "drawer", href = "https://vendor.test/product?private=1#secret") {
    const a = w.document.createElement("a");
    a.href = href; a.dataset.measureEvent = event; a.dataset.productId = id; a.dataset.measureSurface = surface;
    a.textContent = "secret@example.com"; a.addEventListener("click", (e) => e.preventDefault());
    w.document.body.append(a); return a;
}
test("allowlisted click events discard preconsent actions, arbitrary text/URLs and unknown products", async () => {
    const w = await browser();
    const manufacturer = link(w, "manufacturer_click");
    manufacturer.click();
    click(w, "Allow analytics");
    expect(commands(w).filter((c) => c[1] === "manufacturer_click")).toHaveLength(0);
    manufacturer.click();
    link(w, "datasheet_click").click();
    link(w, "manufacturer_click", "secret@example.com").click();
    link(w, "arbitrary_event").click();
    link(w, "guide_product_click", "cubemars-ak80-9", "editorial", "/actuators/cubemars-ak80-9?private=1").click();
    expect(commands(w).filter((c) => c[0] === "event").map((c) => c[1])).toEqual(["page_view", "manufacturer_click", "datasheet_click"]);
    const payload = commands(w).find((c) => c[1] === "manufacturer_click")?.[2];
    expect(payload).toEqual({ product_id: "cubemars-ak80-9", source_path: "https://actuatorlist.com/all", surface: "drawer", page_location: "https://actuatorlist.com/all", page_referrer: "", transport_type: "beacon" });
    click(w, "Analytics preferences"); click(w, "Reject"); manufacturer.click();
    expect(commands(w).filter((c) => c[0] === "event")).toHaveLength(0);
    await w.happyDOM.close();
});
test("guide product click is only editorial to known catalog destination; citations are not conversions", async () => {
    const w = await browser({ consent: "granted" });
    w.history.pushState(null, "", "/guides/robot-actuator-selection?private=1#secret");
    link(w, "guide_product_click", "cubemars-ak80-9", "editorial", "/actuators/cubemars-ak80-9?q=private#secret").click();
    link(w, "guide_product_click", "cubemars-ak80-9", "editorial", "/actuators/xiaomi-cybergear").click();
    link(w, "manufacturer_click", "cubemars-ak80-9", "editorial").click();
    const events = commands(w).filter((c) => c[1] === "guide_product_click");
    expect(events).toHaveLength(1);
    expect(events[0]?.[2]).toEqual({ product_id: "cubemars-ak80-9", source_path: "https://actuatorlist.com/guides/robot-actuator-selection", surface: "editorial", page_location: "https://actuatorlist.com/guides/robot-actuator-selection", page_referrer: "https://actuatorlist.com/all", destination_path: "https://actuatorlist.com/actuators/cubemars-ak80-9", transport_type: "beacon" });
    await w.happyDOM.close();
});
test("comparison action uses distinct catalog IDs, bounded surfaces and no extra parameters", async () => {
    const w = await browser({ consent: "granted" });
    const dispatch = (detail: object) => w.dispatchEvent(new w.CustomEvent("actuatorlist:compare", { detail }));
    dispatch({ action: "open", productIds: ["cubemars-ak80-9"] });
    dispatch({ action: "open", productIds: ["cubemars-ak80-9", "cubemars-ak80-9"] });
    dispatch({ action: "open", productIds: ["cubemars-ak80-9", "unknown"] });
    dispatch({ action: "open", productIds: ["cubemars-ak80-9", "xiaomi-cybergear"], email: "private@example.com" });
    dispatch({ action: "update", productIds: ["xiaomi-cybergear"] });
    expect(commands(w).filter((c) => c[0] === "event").map((c) => c[1])).toEqual(["page_view", "compare_open", "compare_update"]);
    expect(commands(w).find((c) => c[1] === "compare_open")?.[2]).toEqual({ product_id_1: "cubemars-ak80-9", product_id_2: "xiaomi-cybergear", product_count: 2, source_path: "https://actuatorlist.com/all", surface: "comparison", page_location: "https://actuatorlist.com/all", page_referrer: "", transport_type: "beacon" });
    await w.happyDOM.close();
});
test("gallery and dedicated comparison actions are measured only on bounded comparison routes", async () => {
    const w = await browser({ consent: "granted" });
    const dispatch = (action: string, productIds = ["cubemars-ak80-9", "xiaomi-cybergear"]) =>
        w.dispatchEvent(new w.CustomEvent("actuatorlist:compare", { detail: { action, productIds } }));
    for (const path of ["/actuators", "/compare"]) {
        w.history.pushState(null, "", `${path}?private=1#secret`);
        dispatch("open");
        dispatch("update", ["xiaomi-cybergear"]);
    }
    const events = commands(w).filter((c) => c[1] === "compare_open" || c[1] === "compare_update");
    expect(events.map((c) => c[1])).toEqual(["compare_open", "compare_update", "compare_open", "compare_update"]);
    expect(events.map((c) => (c[2] as Record<string, unknown>).source_path)).toEqual([
        "https://actuatorlist.com/actuators", "https://actuatorlist.com/actuators",
        "https://actuatorlist.com/compare", "https://actuatorlist.com/compare",
    ]);
    for (const path of ["/", "/faq", "/actuators/cubemars-ak80-9", "/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear"]) {
        w.history.pushState(null, "", path);
        dispatch("open");
    }
    expect(commands(w).filter((c) => c[1] === "compare_open")).toHaveLength(2);
    click(w, "Analytics preferences"); click(w, "Reject");
    w.history.pushState(null, "", "/compare");
    dispatch("open");
    expect(commands(w).filter((c) => c[1] === "compare_open")).toHaveLength(0);
    await w.happyDOM.close();
});

test("engineering tool events carry the route's tool, an allowlisted quantity and catalog IDs only", async () => {
    const w = await browser();
    const dispatch = (detail: object) => w.dispatchEvent(new w.CustomEvent("actuatorlist:tool", { detail }));
    w.history.pushState(null, "", "/tools/motor-torque-calculator?t=12&n=300");
    dispatch({ action: "result", quantity: "power" });
    click(w, "Allow analytics");
    expect(commands(w).filter((c) => c[1] === "tool_result")).toHaveLength(0);
    dispatch({ action: "result", quantity: "power", torque: 12 });
    dispatch({ action: "result", quantity: "12 Nm" });
    dispatch({ action: "shortlist", target: "product", productIds: ["cubemars-ak80-9"] });
    dispatch({ action: "shortlist", target: "product", productIds: ["unknown"] });
    dispatch({ action: "shortlist", target: "compare", productIds: ["xiaomi-cybergear", "cubemars-ak80-9"] });
    dispatch({ action: "shortlist", target: "compare", productIds: ["cubemars-ak80-9", "cubemars-ak80-9"] });
    const page = "https://actuatorlist.com/tools/motor-torque-calculator";
    const base = { source_path: page, page_location: page, page_referrer: "", surface: "tool", transport_type: "beacon" };
    expect(commands(w).filter((c) => c[0] === "event" && c[1] !== "page_view").map((c) => [c[1], c[2]])).toEqual([
        ["tool_result", { ...base, tool: "motor-torque", quantity: "power" }],
        ["tool_shortlist_click", { ...base, tool: "motor-torque", target: "product", product_id: "cubemars-ak80-9" }],
        ["tool_shortlist_click", { ...base, tool: "motor-torque", target: "compare", product_id_1: "cubemars-ak80-9", product_id_2: "xiaomi-cybergear", product_count: 2 }],
    ]);
    w.history.pushState(null, "", "/tools/robot-arm-torque-calculator");
    dispatch({ action: "result", quantity: "holding" });
    expect(commands(w).filter((c) => c[1] === "tool_result").map((c) => (c[2] as Record<string, unknown>).tool)).toEqual(["motor-torque", "arm-torque"]);
    for (const path of ["/all", "/guides/humanoid-robot-actuators", "/tools/unknown"]) {
        w.history.pushState(null, "", path);
        dispatch({ action: "result", quantity: "torque" });
        dispatch({ action: "shortlist", target: "product", productIds: ["cubemars-ak80-9"] });
    }
    expect(commands(w).filter((c) => String(c[1]).startsWith("tool_"))).toHaveLength(4);
    await w.happyDOM.close();
});
test("page views count canonical pathname changes only after consent, and resuming never duplicates the current view", async () => {
    const w = await browser();
    w.history.pushState(null, "", "/actuators?q=private");
    click(w, "Allow analytics");
    w.history.replaceState(null, "", "/actuators?q=changed#hash");
    w.history.pushState(null, "", "/all?secret=yes");
    w.dispatchEvent(new w.PopStateEvent("popstate"));
    expect(commands(w).filter((c) => c[1] === "page_view").map((c) => c[2])).toEqual([
        expect.objectContaining({ page_location: "https://actuatorlist.com/actuators" }),
        expect.objectContaining({ page_location: "https://actuatorlist.com/all" }),
    ]);
    click(w, "Analytics preferences"); click(w, "Allow analytics");
    expect(commands(w).filter((c) => c[1] === "page_view")).toHaveLength(2);
    await w.happyDOM.close();
});
test("config denies all advertising and every custom event explicitly overrides URL and referrer", async () => {
    const w = await browser({ consent: "granted" });
    expect(commands(w).find((c) => c[0] === "config")?.[2]).toEqual(expect.objectContaining({ send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false }));
    expect(commands(w).find((c) => c[0] === "consent" && c[1] === "default")?.[2]).toEqual({ analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    link(w, "manufacturer_click").click();
    expect(commands(w).find((c) => c[1] === "manufacturer_click")?.[2]).toEqual(expect.objectContaining({ page_location: "https://actuatorlist.com/all", page_referrer: expect.not.stringContaining("?") }));
    w.history.pushState(null, "", "/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear");
    link(w, "datasheet_click", "cubemars-ak80-9", "editorial-source").click();
    expect(commands(w).filter((c) => c[1] === "datasheet_click")).toHaveLength(1);
    await w.happyDOM.close();
});
test("another tab withdrawal stops events and regrant loads no duplicate tag", async () => {
    const w = await browser({ consent: "granted" });
    w.localStorage.setItem("actuatorlist.analytics.v1", "denied");
    w.dispatchEvent(new w.StorageEvent("storage", { key: "actuatorlist.analytics.v1", newValue: "denied" }));
    link(w, "manufacturer_click").click();
    expect(commands(w).filter((c) => c[0] === "event")).toHaveLength(0);
    click(w, "Analytics preferences"); click(w, "Allow analytics");
    expect(w.document.querySelectorAll('[src*="googletagmanager"]')).toHaveLength(1);
    link(w, "manufacturer_click").click();
    expect(commands(w).filter((c) => c[1] === "manufacturer_click")).toHaveLength(1);
    await w.happyDOM.close();
});
test("empty referrer stays empty and populated referrer loses credentials, query and hash", async () => {
    for (const [referrer, expected] of [["", ""], ["https://user:pass@search.test/search?q=private#secret", "https://search.test/search"]]) {
        const w = await browser({ consent: "granted", referrer });
        expect(commands(w).find((c) => c[1] === "page_view")?.[2]).toEqual(expect.objectContaining({ page_referrer: expected }));
        await w.happyDOM.close();
    }
});
