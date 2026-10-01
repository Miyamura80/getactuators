import { ACTUATORS } from "../catalog";

// Runtime-only public configuration: never interpolate an unchecked env value.
export function measurementHtml(
    html: string,
    path: string,
    id = process.env.GA4_MEASUREMENT_ID,
): string {
    if (!id || !/^G-[A-Z0-9]{6,20}$/.test(id)) return html;
    const products = ACTUATORS.map((a) => a.id);
    const product = ACTUATORS.find((a) => path === `/actuators/${a.id}`);
    const editorial = path.startsWith("/guides/") || path.startsWith("/comparisons/");
    // Exact reviewed primary documents only. Research papers and general citations stay untracked.
    const editorialSources = [
        {
            id: "cubemars-ak80-9",
            url: "https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html",
            event: "manufacturer_click",
        },
        {
            id: "cubemars-ak80-9",
            url: "https://www.cubemars.com/data/cms/202602/ak-series-prodcut-manual-v3-2-0-for-ak-3-0-robotic-actuator.pdf",
            event: "datasheet_click",
        },
        {
            id: "xiaomi-cybergear",
            url: "https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf",
            event: "datasheet_click",
        },
    ];
    const links = new Map<string, { event: string; id: string; surface: string }>();
    if (editorial) {
        for (const a of ACTUATORS)
            links.set(`/actuators/${a.id}`, {
                event: "guide_product_click",
                id: a.id,
                surface: "editorial",
            });
        for (const source of editorialSources)
            links.set(source.url, { ...source, surface: "editorial-source" });
    }
    if (product) {
        if (product.product_url)
            links.set(product.product_url, {
                event: "manufacturer_click",
                id: product.id,
                surface: "product",
            });
        if (product.datasheet_url)
            links.set(product.datasheet_url, {
                event: "datasheet_click",
                id: product.id,
                surface: "product",
            });
    }
    const rewriter = new HTMLRewriter()
        .on("head", {
            element(el) {
                el.append(
                    `<script defer src="/measurement.js" data-ga4-id="${id}" data-products="${products.join(",")}"></script>`,
                    { html: true },
                );
            },
        })
        .on("a[href]", {
            element(el) {
                const annotation = links.get(el.getAttribute("href") ?? "");
                if (!annotation) return;
                el.setAttribute("data-measure-event", annotation.event);
                el.setAttribute("data-product-id", annotation.id);
                el.setAttribute("data-measure-surface", annotation.surface);
            },
        });
    return rewriter.transform(html);
}
