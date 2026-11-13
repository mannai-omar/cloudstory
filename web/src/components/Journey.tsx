import { useEffect, useState } from "react";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useRemote, type JourneyStep } from "../api";
import { fallbackJourney } from "../content";
import { SourceBadge } from "./Reveal";

const STEP_MS = 3200;

export function Journey() {
  const { value } = useRemote<JourneyStep[]>("/api/journey");
  const live = value.state === "ok" && value.data.length > 0;
  const steps = live ? value.data : fallbackJourney;

  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setActive((current) => {
        if (current >= steps.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [playing, steps.length]);

  const togglePlay = () => {
    if (!playing && active === steps.length - 1) setActive(0);
    setPlaying(!playing);
  };

  const select = (index: number) => {
    setPlaying(false);
    setActive(index);
  };

  const step = steps[Math.min(active, steps.length - 1)];
  const progress = ((active + 1) / steps.length) * 100;

  return (
    <section className="section" id="journey">
      <div className="section-label">02 / THE JOURNEY</div>
      <h2>One commit. Six automated steps.</h2>
      <p className="section-description">
        Follow a code change from my machine all the way to a running, monitored application.
      </p>

      <div className="journey-toolbar">
        <button className="play-button" onClick={togglePlay}>
          {playing ? <Pause size={15} /> : <Play size={15} />}
          {playing ? "Pause" : "Play the journey"}
        </button>
        <SourceBadge live={live} />
      </div>

      <div className="journey-track" aria-hidden="true">
        <div className="journey-progress" style={{ width: `${progress}%` }} />
        <div className={`journey-packet ${playing ? "moving" : ""}`} style={{ left: `${progress}%` }}>
          📦
        </div>
      </div>

      <div className="pipeline-layout">
        <div className="pipeline-steps" role="tablist" aria-label="Pipeline steps">
          {steps.map((item, index) => (
            <button
              key={item.position}
              role="tab"
              aria-selected={active === index}
              className={`pipeline-step ${active === index ? "active" : ""} ${index < active ? "done" : ""}`}
              onClick={() => select(index)}
            >
              <span className="step-number">{String(item.position).padStart(2, "0")}</span>
              <span className="step-name">{item.name}</span>
              <ArrowRight size={17} />
            </button>
          ))}
        </div>

        <div className="pipeline-detail" role="tabpanel" key={step.position}>
          <span className="detail-label">
            STEP {active + 1} / {steps.length}
          </span>
          <h3>{step.name}</h3>
          <span className="tool-tag">{step.tool}</span>
          <p>{step.description}</p>
          <div className="detail-navigation">
            <button disabled={active === 0} onClick={() => select(active - 1)}>
              Previous
            </button>
            <button disabled={active === steps.length - 1} onClick={() => select(active + 1)}>
              Next step <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
