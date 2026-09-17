import { BrandMark } from "./BrandMark";

interface Props {
    total: number;
    categories: number;
    countries: number;
}

export function Hero({ total, categories, countries }: Props) {
    return (
        <header className="hero">
            <div className="hero-main">
                <BrandMark size={54} className="hero-mark" />
                <h1>
                    Independent analysis
                    <br />
                    of actuators
                </h1>
                <p className="hero-sub">
                    Compare actuators for robot builders. Quadrupeds, arms, and legged
                    robots, ranked on the specs that decide a build.
                </p>
            </div>
            <dl className="hero-stats">
                <div>
                    <dt>Actuators</dt>
                    <dd>{total}</dd>
                </div>
                <div>
                    <dt>Categories</dt>
                    <dd>{categories}</dd>
                </div>
                <div>
                    <dt>Countries</dt>
                    <dd>{countries}</dd>
                </div>
            </dl>
        </header>
    );
}
