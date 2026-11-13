import { Activity, Boxes, Workflow } from "lucide-react";
import { Reveal } from "./Reveal";

const ideas = [
  {
    tone: "tone-lavender",
    icon: <Workflow />,
    title: "Automate the boring stuff",
    text: "Every push is tested, packaged and deployed by a pipeline. No one runs a deploy by hand.",
  },
  {
    tone: "tone-sky",
    icon: <Boxes />,
    title: "Build a home in the cloud",
    text: "The network, cluster and database are Terraform code that I can create or destroy in minutes.",
  },
  {
    tone: "tone-blush",
    icon: <Activity />,
    title: "Keep an eye on things",
    text: "Metrics, dashboards and alerts show how the system behaves, with real numbers only.",
  },
];

export function Story() {
  return (
    <section className="section section-white" id="story">
      <div className="section-label">01 / THE BIG IDEA</div>
      <h2>So, what's the story?</h2>
      <p className="section-description">
        I didn't just want to build an application. I wanted to build everything around it: the automation,
        infrastructure and monitoring that take code from my laptop to a reliable cloud environment.
      </p>

      <div className="feature-grid">
        {ideas.map((idea, index) => (
          <Reveal key={idea.title} delay={index * 90}>
            <article className={`feature-card ${idea.tone}`}>
              <div className="feature-icon">{idea.icon}</div>
              <h3>{idea.title}</h3>
              <p>{idea.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
