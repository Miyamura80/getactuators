/* Shared opt-in measurement for both server pages and React. No dependencies. */
(() => {
    const script = document.currentScript;
    const id = script?.dataset.ga4Id;
    if (!id || !/^G-[A-Z0-9]{6,20}$/.test(id) || window.__actuatorMeasurement) return;
    window.__actuatorMeasurement = true;
    const key = "actuatorlist.analytics.v1";
    const privacySignal = () => navigator.globalPrivacyControl === true || navigator.doNotTrack === "1" || window.doNotTrack === "1";
    if (privacySignal()) { window[`ga-disable-${id}`] = true; return; }
    let preference;
    try { preference = localStorage.getItem(key); } catch { /* Fail closed. */ }
    let allowed = false;
    let started = false;
    window[`ga-disable-${id}`] = true;
    const denied = { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };
    const canonical = (value) => {
        if (!value) return "";
        try { const url = new URL(value, location.href); return /^https?:$/.test(url.protocol) ? url.origin + url.pathname : ""; }
        catch { return ""; }
    };
    function command() { window.dataLayer.push(arguments); }
    let lastPage;
    let pageReferrer = canonical(document.referrer);
    function pageView() {
        if (!allowed || privacySignal()) return;
        const path = canonical(location.href);
        if (path === lastPage) return;
        const referrer = lastPage || pageReferrer;
        pageReferrer = referrer;
        lastPage = path;
        command("set", { page_location: path, page_referrer: referrer, page_title: "actuatorlist" });
        command("event", "page_view", { page_location: path, page_referrer: referrer, page_title: "actuatorlist", transport_type: "beacon" });
    }
    for (const method of ["pushState", "replaceState"]) {
        const original = history[method];
        history[method] = function (...args) {
            const result = original.apply(this, args);
            pageView();
            return result;
        };
    }
    window.addEventListener("popstate", pageView);
    function allow() {
        if (privacySignal()) return;
        const resuming = started && !allowed;
        allowed = true;
        window[`ga-disable-${id}`] = false;
        if (resuming) { command("consent", "update", { ...denied, analytics_storage: "granted" }); pageView(); }
        if (!started) {
            started = true;
            window.dataLayer = window.dataLayer || [];
            window.gtag = command;
            command("consent", "default", denied);
            command("consent", "update", { ...denied, analytics_storage: "granted" });
            command("js", new Date());
            command("config", id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: canonical(location.href), page_referrer: pageReferrer, page_title: "actuatorlist", cookie_domain: "none" });
            const tag = document.createElement("script");
            tag.async = true;
            tag.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
            document.head.append(tag);
            pageView();
        }
    }
    const style = document.createElement("style");
    style.textContent = '#analytics-banner{position:fixed;bottom:1rem;left:1rem;right:1rem;max-width:38rem;padding:1rem;background:#111;color:#f9f9f9;border:1px solid #54726f;border-radius:6px;z-index:10000;font:14px/1.5 system-ui}#analytics-banner p{margin:0 0 .75rem}#analytics-banner button,#analytics-preferences{font:inherit;color:#c3fffd;background:#111;border:1px solid #54726f;border-radius:4px;padding:.6rem .9rem;cursor:pointer}#analytics-banner button{margin:.25rem .5rem .25rem 0}#analytics-banner button:focus-visible,#analytics-preferences:focus-visible{outline:2px solid #c3fffd;outline-offset:3px}#analytics-preferences{position:fixed;bottom:.5rem;right:.5rem;z-index:9999;font:12px system-ui}';
    document.head.append(style);
    const banner = document.createElement("section");
    banner.id = "analytics-banner";
    banner.setAttribute("aria-label", "Analytics preferences");
    banner.innerHTML = '<p>Optional analytics helps us understand catalog and guide usage. Google Analytics uses cookies only if you allow it. No advertising. <a href="/privacy" style="color:#c3fffd">Privacy details</a></p>';
    function button(label, action, parent) {
        const element = document.createElement("button");
        element.type = "button"; element.textContent = label;
        element.addEventListener("click", action); parent.append(element);
        return element;
    }
    function remember(value) { try { localStorage.setItem(key, value); } catch { /* Session-only choice if storage is unavailable. */ } }
    function clearCookies() {
        const names = document.cookie.split(";").map((part) => part.trim().split("=")[0]).filter((name) => /^_ga(?:_|$)/.test(name));
        const labels = location.hostname.split(".");
        const domains = ["", ...labels.map((_, index) => labels.slice(index).join(".")).filter((domain) => domain.includes("."))];
        const paths = ["/", ...location.pathname.split("/").map((_, index, parts) => parts.slice(0, index + 1).join("/")).filter(Boolean)];
        for (const name of names) for (const domain of domains) for (const path of paths) {
            document.cookie = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domain ? `; domain=${domain}` : ""}; SameSite=Lax`;
        }
    }
    function reject() {
        allowed = false;
        window[`ga-disable-${id}`] = true;
        if (started) {
            // Drop legitimate queued events not yet processed if the tag is delayed.
            for (let index = window.dataLayer.length - 1; index >= 0; index--) {
                if (window.dataLayer[index][0] === "event") window.dataLayer.splice(index, 1);
            }
            command("consent", "update", denied);
        }
        clearCookies();
        remember("denied");
        banner.hidden = true;
        preferences.focus();
    }
    button("Allow analytics", () => { remember("granted"); allow(); banner.hidden = true; preferences.focus(); }, banner);
    button("Reject", reject, banner);
    banner.hidden = preference === "denied" || preference === "granted";
    document.body.append(banner);
    const preferences = button("Analytics preferences", () => { banner.hidden = false; }, document.body);
    preferences.id = "analytics-preferences";
    const products = new Set((script.dataset.products || "").split(",").filter((value) => /^[a-z0-9-]{1,80}$/.test(value)));
    function emit(name, params) {
        if (!allowed || privacySignal()) return;
        command("event", name, { ...params, source_path: canonical(location.href), page_location: canonical(location.href), page_referrer: pageReferrer, transport_type: "beacon" });
    }
    function clickEvent(event) {
        if (event.type === "auxclick" && event.button !== 1) return;
        const anchor = event.target instanceof Element ? event.target.closest("a[data-measure-event]") : null;
        if (!anchor || !products.has(anchor.dataset.productId)) return;
        const name = anchor.dataset.measureEvent;
        const surface = anchor.dataset.measureSurface;
        if (!["drawer", "product", "editorial", "editorial-source"].includes(surface)) return;
        const params = { product_id: anchor.dataset.productId, surface };
        if (name === "guide_product_click") {
            if (surface !== "editorial" || !/^\/(guides|comparisons)\//.test(location.pathname)) return;
            const destination = new URL(anchor.href, location.href);
            if (destination.origin !== location.origin || destination.pathname !== `/actuators/${params.product_id}`) return;
            emit(name, { ...params, destination_path: canonical(destination.href) });
        } else if (["manufacturer_click", "datasheet_click"].includes(name) && surface !== "editorial") {
            if (!/^https?:$/.test(new URL(anchor.href, location.href).protocol)) return;
            emit(name, params);
        }
    }
    document.addEventListener("click", clickEvent, true);
    document.addEventListener("auxclick", clickEvent, true);
    window.addEventListener("actuatorlist:compare", (event) => {
        const detail = event.detail;
        if (!detail || !["open", "update"].includes(detail.action) || !Array.isArray(detail.productIds)) return;
        const ids = [...new Set(detail.productIds)];
        if (ids.length > 4 || ids.length < (detail.action === "open" ? 2 : 1) || !ids.every((value) => products.has(value))) return;
        if (location.pathname !== "/all") return;
        const productParams = Object.fromEntries(ids.sort().map((value, index) => [`product_id_${index + 1}`, value]));
        emit(`compare_${detail.action}`, { ...productParams, product_count: ids.length, surface: "comparison" });
    });
    window.addEventListener("storage", (event) => {
        if ((event.key === key || event.key === null) && event.newValue !== "granted") reject();
    });
    if (preference === "granted") allow();
})();