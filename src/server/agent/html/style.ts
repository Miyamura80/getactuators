import NAVIGATION_CSS from "../../../public-navigation.css" with { type: "text" };
// Minimal styling for server-rendered markup, following BRAND.md: black
// background, Graphene Grey secondary text, Core Cyan links, Inter and
// JetBrains Mono. Scoped under .ga-page so it never leaks into the React app.
export const PAGE_CSS = `

.ga-page{background:#000;color:#f9f9f9;font-family:Inter,system-ui,sans-serif;line-height:1.6;margin:0}
.ga-page .ga-nav,.ga-page .ga-footer nav{display:flex;flex-wrap:wrap;gap:1.25rem;padding:1rem 1.5rem;border-bottom:1px solid #242424;font-size:.9rem}
.ga-page .ga-footer nav{border-bottom:0;border-top:1px solid #242424;margin-top:3rem}
.ga-page .ga-main{max-width:60rem;margin:0 auto;padding:2rem 1.5rem}
.ga-page a{color:#c3fffd}
.ga-page .ga-main{min-width:0;overflow-wrap:anywhere}
.ga-page .ga-table-scroll{overflow-x:auto;margin:1rem 0}
.ga-page .ga-table-scroll:focus-visible,.ga-page a:focus-visible{outline:2px solid #c3fffd;outline-offset:3px}
.ga-page .ga-table-scroll table{min-width:34rem;overflow-wrap:normal}
.ga-page.ga-editorial .ga-main{max-width:75rem;box-sizing:border-box}
.ga-editorial .ga-main>p{max-width:72ch}
.ga-editorial-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;align-items:start;margin-top:1.5rem}
.ga-editorial-section{min-width:0;padding:1.25rem;border:1px solid #242424;border-radius:4px;background:#0a0a0a}
.ga-editorial .ga-editorial-section>h2{border:0;margin-top:0;padding-top:0;font-size:1.3rem}
.ga-editorial-section:has(.ga-photo-card),.ga-editorial-section:has(th:nth-child(4)){grid-column:1/-1}
.ga-editorial .ga-main ul:has(>.ga-photo-card){list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));gap:1rem}
.ga-editorial .ga-photo-card{min-width:0;display:grid;grid-template-columns:8rem minmax(0,1fr);gap:.875rem;align-items:start;font-size:.85rem}
.ga-editorial .ga-photo-card img{display:block;width:8rem;max-width:100%;height:8rem;object-fit:contain;background:#fff;box-sizing:border-box;border-radius:3px}
.ga-editorial .ga-photo-copy{min-width:0}
@media(max-width:800px){.ga-editorial-grid{grid-template-columns:minmax(0,1fr)}.ga-editorial .ga-main{padding:1.5rem 1rem}.ga-editorial-section{padding:1rem}.ga-editorial .ga-photo-card{grid-template-columns:6rem minmax(0,1fr)}.ga-editorial .ga-photo-card img{width:6rem;height:6rem}}
.ga-editorial .ga-dashboard .ga-product-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
.ga-editorial .ga-dashboard .ga-photo-card{display:block;min-width:0;border:1px solid #242424;border-radius:6px;background:#0a0a0a;overflow:hidden}
.ga-editorial .ga-dashboard .ga-photo-link{display:flex;justify-content:center;padding:1rem;background:#101010}
.ga-editorial .ga-dashboard .ga-photo-card img{width:280px;height:280px;max-width:100%;object-fit:contain}
.ga-editorial .ga-dashboard .ga-photo-copy{padding:1rem}
.ga-editorial .ga-dashboard h2{border:0;margin:0 0 .75rem;padding:0;font-size:1.25rem;line-height:1.3}
.ga-editorial .ga-deck{font-size:1rem;margin-top:.5rem}
.ga-editorial .ga-spec-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.5rem;margin:.75rem 0}
.ga-editorial .ga-spec-chip{min-width:0;border:1px solid #303030;border-radius:4px;padding:.5rem .6rem}
.ga-editorial .ga-spec-chip dt{font-size:.65rem;text-transform:uppercase;color:#9ba4a6;letter-spacing:.03em}
.ga-editorial .ga-spec-chip dd{font-size:1rem;font-weight:600;margin:0}
.ga-editorial .ga-photo-note,.ga-editorial .ga-photo-provenance,.ga-editorial .ga-provenance-alert{font-size:.75rem;line-height:1.4;margin:.65rem 0}
.ga-editorial .ga-provenance-alert{border-left:2px solid #c3fffd;padding:.5rem .75rem;background:#101010}
.ga-editorial .ga-evidence-legend{display:flex;flex-wrap:wrap;gap:.65rem 1.25rem;list-style:none;padding:0;font-size:.75rem}
.ga-editorial .ga-badge{display:inline-block;color:#c3fffd;border:1px solid #354746;border-radius:3px;padding:.1rem .35rem;font-size:.65rem;font-weight:600;letter-spacing:.02em}
.ga-editorial .ga-evidence-panel{min-width:0;padding:1.1rem;background:#0a0a0a;border:1px solid #242424;border-radius:6px}
.ga-editorial .ga-evidence-panel p,.ga-editorial .ga-evidence-panel li{font-size:.85rem;line-height:1.45}
.ga-editorial .ga-evidence-panel ul{padding-left:1.15rem}
.ga-editorial .ga-source{font-size:.75rem}
.ga-editorial .ga-limit{border-left:2px solid #686565;padding-left:.6rem}
.ga-editorial .ga-concept{margin:.75rem 0 1rem;text-align:center}
.ga-editorial .ga-concept svg{display:block;width:100%;max-width:360px;margin:0 auto;overflow:visible}
.ga-editorial .ga-concept rect{fill:#111;stroke:#54726f;stroke-width:1.5}
.ga-editorial .ga-concept text{fill:#f9f9f9;font:16px Inter,system-ui,sans-serif}
.ga-editorial .ga-concept path{stroke:#c3fffd;stroke-width:2;fill:none;stroke-linejoin:round}
.ga-editorial .ga-concept .ga-svg-note{fill:#9ba4a6;font-size:12px}
.ga-editorial .ga-concept .ga-svg-dashed{stroke-dasharray:4 4}
.ga-editorial .ga-concept figcaption{font-size:.65rem;color:#9ba4a6}
.ga-editorial .ga-verdict{margin-top:1rem;padding:1rem;border:1px solid #54726f;border-radius:6px}
.ga-editorial .ga-verdict p{font-size:.85rem;line-height:1.45;margin:.5rem 0}
.ga-editorial .ga-methodology{margin-top:1.5rem;border-top:1px solid #242424;padding-top:1rem}
.ga-editorial .ga-methodology summary{cursor:pointer;color:#c3fffd;font-weight:600;padding:.5rem 0}
.ga-editorial .ga-methodology summary:focus-visible{outline:2px solid #c3fffd;outline-offset:3px}
@media(max-width:800px){.ga-editorial .ga-dashboard .ga-product-pair{grid-template-columns:minmax(0,1fr)}.ga-editorial .ga-dashboard .ga-photo-card img{width:240px;height:240px}.ga-editorial .ga-spec-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
.ga-page .ga-faq-item{border-bottom:1px solid #242424}
.ga-page .ga-faq-item summary{box-sizing:border-box;min-height:44px;padding:.75rem .5rem;cursor:pointer}
.ga-page .ga-faq-item summary h3{display:inline;margin:0;font-size:1rem;font-weight:600;line-height:1.5}
.ga-page .ga-faq-item summary::marker{color:#c3fffd}
.ga-page .ga-faq-item summary:hover{background:#0a0a0a}
.ga-page .ga-faq-item summary:focus-visible{outline:2px solid #c3fffd;outline-offset:3px}
.ga-page .ga-faq-item>p{margin:.25rem .5rem 1rem}
.ga-page h1{font-size:2rem;line-height:1.2}
.ga-page h2{border-top:1px solid #242424;padding-top:1.5rem;margin-top:2rem}
.ga-page p,.ga-page li,.ga-page td{color:#9ba4a6}
.ga-page table{border-collapse:collapse;width:100%;font-size:.85rem}
.ga-page th,.ga-page td{border:1px solid #242424;padding:.35rem .5rem;text-align:left}
.ga-page code,.ga-page pre{font-family:"JetBrains Mono",monospace;background:#0a0a0a}
.ga-page pre{padding:1rem;overflow-x:auto}
.ga-page blockquote{border-left:2px solid #c3fffd;margin-left:0;padding-left:1rem}
${NAVIGATION_CSS}
`.trim();
