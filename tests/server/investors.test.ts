import { expect, test } from "bun:test";
import { get } from "./agent-helpers";

test("/investors previews with its own card, which is served", async () => {
    const html = await (await get("/investors")).text();
    expect(html).toContain(
        '<meta property="og:image" content="https://actuatorlist.com/og-investors.png">',
    );
    const card = await get("/og-investors.png");
    expect(card.status).toBe(200);
    expect(card.headers.get("content-type")).toBe("image/png");
});
