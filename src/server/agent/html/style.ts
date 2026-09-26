// Minimal styling for server-rendered markup, following BRAND.md: black
// background, Graphene Grey secondary text, Core Cyan links, Inter and
// JetBrains Mono. Scoped under .ga-page so it never leaks into the React app.
export const PAGE_CSS = `
.ga-page{background:#000;color:#f9f9f9;font-family:Inter,system-ui,sans-serif;line-height:1.6;margin:0}
.ga-page .ga-nav,.ga-page .ga-footer nav{display:flex;flex-wrap:wrap;gap:1.25rem;padding:1rem 1.5rem;border-bottom:1px solid #242424;font-size:.9rem}
.ga-page .ga-footer nav{border-bottom:0;border-top:1px solid #242424;margin-top:3rem}
.ga-page .ga-main{max-width:60rem;margin:0 auto;padding:2rem 1.5rem}
.ga-page a{color:#c3fffd}
.ga-page h1{font-size:2rem;line-height:1.2}
.ga-page h2{border-top:1px solid #242424;padding-top:1.5rem;margin-top:2rem}
.ga-page p,.ga-page li,.ga-page td{color:#9ba4a6}
.ga-page table{border-collapse:collapse;width:100%;font-size:.85rem}
.ga-page th,.ga-page td{border:1px solid #242424;padding:.35rem .5rem;text-align:left}
.ga-page code,.ga-page pre{font-family:"JetBrains Mono",monospace;background:#0a0a0a}
.ga-page pre{padding:1rem;overflow-x:auto}
.ga-page blockquote{border-left:2px solid #c3fffd;margin-left:0;padding-left:1rem}
`.trim();
