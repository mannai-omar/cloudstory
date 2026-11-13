import { BookOpen, GitBranch, KeyRound, Moon, Network, ShieldCheck, Undo2 } from "lucide-react";
import { Brand } from "./Navbar";
import { GITHUB_URL } from "../content";
import { Reveal } from "./Reveal";

const decisions = [
  {
    icon: <Undo2 />,
    title: "GitOps over push-based deploys",
    text: "CI never touches the cluster. It updates Git, and Argo CD pulls. A rollback is a git revert.",
  },
  {
    icon: <KeyRound />,
    title: "No long-lived cloud keys",
    text: "GitHub Actions assumes an AWS role through OIDC, and pods use IAM roles for service accounts.",
  },
  {
    icon: <ShieldCheck />,
    title: "Health and metrics on a private port",
    text: "Probes and /actuator/prometheus run on port 8081, so they are never exposed through the ingress.",
  },
  {
    icon: <Network />,
    title: "Liveness ≠ readiness",
    text: "A database outage takes pods out of rotation but doesn't restart them in a loop.",
  },
  {
    icon: <Moon />,
    title: "Built to be switched off",
    text: "terraform destroy at night keeps costs low, and the site degrades gracefully instead of breaking.",
  },
  {
    icon: <BookOpen />,
    title: "Real numbers only",
    text: "The Operations Room shows measured data or says it can't. It never simulates activity.",
  },
];

const stack = ["AWS", "Terraform", "Docker", "Kubernetes (EKS)", "Argo CD", "Helm", "GitHub Actions", "Prometheus", "Grafana", "Spring Boot", "PostgreSQL", "React"];

export function BehindTheBuild() {
  return (
    <section className="section section-white" id="build">
      <div className="section-label">05 / BEHIND THE BUILD</div>
      <h2>The decisions behind it.</h2>
      <p className="section-description">
        Any tool can be installed in an afternoon. What matters is why it's set up that way.
      </p>

      <div className="decision-grid">
        {decisions.map((d, index) => (
          <Reveal key={d.title} delay={index * 60}>
            <article className="decision-card">
              <span className="feature-icon small">{d.icon}</span>
              <h3>{d.title}</h3>
              <p>{d.text}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <div className="stack-row" aria-label="Technology stack">
        {stack.map((tech) => (
          <span key={tech} className="chip static">
            {tech}
          </span>
        ))}
      </div>

      <a className="primary-button centered" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
        <GitBranch size={17} /> Read the code and docs on GitHub
      </a>
    </section>
  );
}

export function Footer() {
  return (
    <footer>
      <Brand />
      <p>A little cloud engineering, told differently.</p>
      <span>© {new Date().getFullYear()} CloudStory · Built with curiosity ☁️</span>
    </footer>
  );
}
