import { useEffect } from "react";
import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";
import { PeopleGrid } from "../components/people/PeopleGrid";
import { CONTRIBUTIONS_AS_OF, CONTRIBUTORS_PATH, peopleIn } from "../../../src/people";
import "./tools.css";

const TITLE = "Contributors";
const REPO = "https://github.com/Miyamura80/getactuators";

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

                <PeopleGrid label="Core" people={peopleIn("contributor-core")} core />
                <PeopleGrid label="Contributors" people={peopleIn("contributor")} />

                <div className="ctb-foot">
                    <a className="req-cta" href={REPO} target="_blank" rel="noopener">
                        Contribute on GitHub
                    </a>
                    <p>
                        Commits from git history, as of {CONTRIBUTIONS_AS_OF}. Listed and want a change?{" "}
                        <a href="/contact">Contact</a>
                    </p>
                </div>
            </main>
            <PublicFooter />
        </div>
    );
}
