import { useEffect } from "react";
import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";
import { PeopleGrid } from "../components/people/PeopleGrid";
import { CONTRIBUTORS, CONTRIBUTORS_PATH } from "../../../src/people";
import { REPO_URL } from "../../../src/public-navigation";
import "./tools.css";

const TITLE = "Contributors";

export function Contributors({ menuOpen = false }: { menuOpen?: boolean }) {
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => {
            document.title = prev;
        };
    }, []);

    return (
        <div className="tool-page">
            <PublicHeader path={CONTRIBUTORS_PATH} initialOpen={menuOpen} />
            <main className="tool-main">
                <header className="tool-head">
                    <p className="tool-kicker">Contributors</p>
                    <h1>Who builds actuatorlist</h1>
                </header>

                <PeopleGrid label="Core" people={CONTRIBUTORS.filter((p) => p.contributor === "core")} />
                <PeopleGrid label="Contributors" people={CONTRIBUTORS.filter((p) => p.contributor === "member")} />

                <div className="ctb-foot">
                    <a className="req-cta" href={REPO_URL} target="_blank" rel="noopener">
                        Contribute on GitHub
                    </a>
                    <p>
                        Listed and want a change?{" "}
                        <a href="/contact">Contact</a>
                    </p>
                </div>
            </main>
            <PublicFooter />
        </div>
    );
}
