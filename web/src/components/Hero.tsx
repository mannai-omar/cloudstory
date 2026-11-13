import { Activity, ArrowDown, ArrowRight, Cloud, Sparkles, Workflow } from "lucide-react";
import { scrollToSection } from "./Navbar";

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <div className="eyebrow">
          <Sparkles size={15} /> A CLOUD ENGINEERING JOURNEY
        </div>

        <h1>
          From a little piece of code to a <span>whole cloud.</span>
        </h1>

        <p>
          What actually happens when you deploy an application? I built the whole path, from a commit to a
          monitored service running on AWS, and this site lets you walk through it.
        </p>

        <div className="hero-actions">
          <button className="primary-button" onClick={() => scrollToSection("story")}>
            Explore the story <ArrowRight size={17} />
          </button>
          <button className="text-button" onClick={() => scrollToSection("explore")}>
            Meet the infrastructure <ArrowDown size={16} />
          </button>
        </div>

        <ul className="hero-pills" aria-label="Highlights">
          <li><strong>Automated</strong> deployments</li>
          <li><strong>Scalable</strong> infrastructure</li>
          <li><strong>Observable</strong> operations</li>
        </ul>
      </div>

      <div className="hero-art" aria-hidden="true">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />

        <div className="floating-card card-top">
          <span className="mini-icon icon-lavender">
            <Workflow size={19} />
          </span>
          <div>
            <strong>Automation</strong>
            <small>Less manual work</small>
          </div>
        </div>

        <div className="cloud-illustration">
          <Cloud size={126} strokeWidth={1.2} />
          <div className="cloud-sparkle sparkle-one">✦</div>
          <div className="cloud-sparkle sparkle-two">✧</div>
        </div>

        <div className="floating-card card-bottom">
          <span className="mini-icon icon-sky">
            <Activity size={19} />
          </span>
          <div>
            <strong>Observability</strong>
            <small>Know what's happening</small>
          </div>
        </div>
      </div>
    </section>
  );
}
