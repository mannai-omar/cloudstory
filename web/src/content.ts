import type { InfraComponent, JourneyStep, Layer } from "./api";

/**
 * Offline copy of the story content. The site uses the API's version when it is reachable and this
 * one when the infrastructure is switched off, so the story always works.
 * Keep in sync with api/src/main/resources/db/migration/V2__seed_content.sql.
 */
export const fallbackJourney: JourneyStep[] = [
  { position: 1, name: "Write code", tool: "GitHub", description: "I push a change. A pull request opens and the pipeline wakes up." },
  { position: 2, name: "Build & test", tool: "GitHub Actions", description: "Unit and integration tests run against a real PostgreSQL in a throwaway container." },
  { position: 3, name: "Package", tool: "Docker + Amazon ECR", description: "Each service becomes an image tagged with the commit SHA, scanned for vulnerabilities, then pushed to ECR." },
  { position: 4, name: "Declare", tool: "GitOps repository", description: "The pipeline bumps the image tag in Git. Git is now the single source of truth for what should run." },
  { position: 5, name: "Deploy", tool: "Argo CD + Kubernetes", description: "Argo CD notices the change and syncs the cluster. Pods roll out only after their readiness probes pass." },
  { position: 6, name: "Observe", tool: "Prometheus + Grafana", description: "Metrics are scraped every few seconds. Alerts fire if errors rise or pods keep restarting." },
];

export const fallbackComponents: InfraComponent[] = [
  { slug: "github", name: "Source code", layer: "source", tool: "GitHub", description: "Application code, Terraform and Kubernetes manifests all live in Git.", why: "Every change is reviewed, versioned and reversible.", position: 1 },
  { slug: "actions", name: "CI pipeline", layer: "delivery", tool: "GitHub Actions", description: "Tests, builds, scans and publishes images on every push.", why: "Authenticates to AWS with OIDC, so there are no long-lived access keys to leak.", position: 2 },
  { slug: "ecr", name: "Image registry", layer: "aws", tool: "Amazon ECR", description: "Stores versioned container images close to the cluster.", why: "Private, scanned on push, and pulled by nodes using IAM instead of passwords.", position: 3 },
  { slug: "terraform", name: "Infrastructure as code", layer: "delivery", tool: "Terraform", description: "Describes the VPC, cluster, database and registry as code.", why: "The whole environment can be created or destroyed with one command, which keeps costs under control.", position: 4 },
  { slug: "vpc", name: "Network", layer: "aws", tool: "Amazon VPC", description: "Public subnets for the load balancer, private subnets for nodes and the database.", why: "Nothing that stores data is reachable from the internet.", position: 5 },
  { slug: "eks", name: "Kubernetes cluster", layer: "aws", tool: "Amazon EKS", description: "Runs the frontend and API as replicated, self-healing pods.", why: "A managed control plane, so the effort goes into the workloads rather than etcd.", position: 6 },
  { slug: "rds", name: "Database", layer: "aws", tool: "Amazon RDS for PostgreSQL", description: "Stores story content and the real deployment history.", why: "Automated backups and patching; credentials come from AWS Secrets Manager.", position: 7 },
  { slug: "argocd", name: "GitOps controller", layer: "cluster", tool: "Argo CD", description: "Keeps the cluster in sync with what Git declares.", why: "Drift is detected and corrected; a rollback is a git revert.", position: 8 },
  { slug: "ingress", name: "Ingress", layer: "cluster", tool: "AWS Load Balancer Controller", description: "Routes HTTPS traffic to the frontend and /api to the API.", why: "TLS terminates at the edge and only public routes are exposed.", position: 9 },
  { slug: "api", name: "CloudStory API", layer: "cluster", tool: "Spring Boot", description: "Serves content, deployment history and live status.", why: "Separate management port, health probes and Prometheus metrics built in.", position: 10 },
  { slug: "web", name: "CloudStory web", layer: "cluster", tool: "React + nginx", description: "The site you are reading, served as static files.", why: "Still works when the API is down: the story never depends on the infrastructure being up.", position: 11 },
  { slug: "prometheus", name: "Metrics", layer: "observability", tool: "Prometheus", description: "Scrapes request rate, errors and latency from every pod.", why: "The Operations Room reads from here, so its numbers are real.", position: 12 },
  { slug: "grafana", name: "Dashboards & alerts", layer: "observability", tool: "Grafana + Alertmanager", description: "Dashboards for humans and alerts for when something breaks.", why: "Problems are noticed by a machine before a visitor does.", position: 13 },
];

export const layers: { id: Layer; title: string; hint: string }[] = [
  { id: "source", title: "Source", hint: "Where every change starts" },
  { id: "delivery", title: "Delivery", hint: "Automation that ships it" },
  { id: "aws", title: "AWS", hint: "The home it runs in" },
  { id: "cluster", title: "Inside the cluster", hint: "What Kubernetes runs" },
  { id: "observability", title: "Observability", hint: "How I know it works" },
];

/** Who talks to whom. Used to highlight neighbours on the map. */
export const connections: [string, string][] = [
  ["github", "actions"],
  ["github", "argocd"],
  ["actions", "ecr"],
  ["actions", "github"],
  ["terraform", "vpc"],
  ["terraform", "eks"],
  ["terraform", "rds"],
  ["terraform", "ecr"],
  ["vpc", "eks"],
  ["vpc", "rds"],
  ["eks", "argocd"],
  ["eks", "ecr"],
  ["argocd", "api"],
  ["argocd", "web"],
  ["ingress", "web"],
  ["ingress", "api"],
  ["api", "rds"],
  ["api", "prometheus"],
  ["prometheus", "grafana"],
];

export const GITHUB_URL: string = import.meta.env.VITE_GITHUB_URL ?? "https://github.com/";
