import { FOOTER_GROUPS } from "../../../src/public-navigation";
import { isRepoHref } from "../../../src/repo-link";
import { GitHubMark } from "./GitHubMark";

export function PublicFooter() {
    return <footer className="site-footer"><nav aria-label="Footer">
        {FOOTER_GROUPS.map((group) => <section key={group.label}>
            <h2>{group.label}</h2>
            {group.links.map(([href, label]) => <a key={href} href={href}>{isRepoHref(href) && <GitHubMark />}{label}</a>)}
        </section>)}
    </nav></footer>;
}
