import { renderToString } from "react-dom/server";
import { GalleryRoot } from "../src/GalleryRoot";

// React's eager-image resource hint belongs in the document head, where the
// backend already supplies it. Keep the fragment exclusively the hydrated tree.
const html = await new HTMLRewriter()
    .on('link[rel="preload"][as="image"]', { element: (el) => el.remove() })
    .transform(new Response(renderToString(<GalleryRoot />)))
    .text();
await Bun.write(`${import.meta.dir}/../dist/actuators.html`, html);
console.log("Prerendered /actuators gallery");
