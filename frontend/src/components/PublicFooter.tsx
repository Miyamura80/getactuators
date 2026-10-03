import { FOOTER_GROUPS } from "../../../src/public-navigation";

export function PublicFooter() {
    return <footer className="site-footer"><nav aria-label="Footer">
        {FOOTER_GROUPS.map((group) => <section key={group.label}>
            <h2>{group.label}</h2>
            {group.links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
        </section>)}
    </nav></footer>;
}
