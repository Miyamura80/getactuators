import { BrandMark } from "./BrandMark";

export function Hero() {
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
        </header>
    );
}
