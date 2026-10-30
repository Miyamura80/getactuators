import { GITHUB_MARK_PATH } from "../../../src/repo-link";

// Inline GitHub mark placed before the text of a link into the repository.
export function GitHubMark() {
    return <svg className="gh-mark" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d={GITHUB_MARK_PATH} />
    </svg>;
}
