# ☁️ CloudStory

**The cloud, explained.** From a little piece of code to a whole cloud.

CloudStory is a portfolio project in two parts:

1. **A small, real application.** A React site and a Spring Boot API backed by PostgreSQL. It tells the story of how the
   app is built and deployed, and it shows real operational data from the system it runs on.
2. **The platform that runs it.** CI/CD, Terraform on AWS, Kubernetes, GitOps and observability. This is the real
   point of the project.

> The application layer was scaffolded with AI help so I could put my time into the cloud and DevOps work.
> Everything under `infra/`, `deploy/` and `.github/` is mine. *(Adjust this note to match how you actually built it.
> Being upfront about it is the honest choice and reads well to interviewers.)*

---

## Repository layout

```
cloudstory/
├── api/                  Spring Boot 3 · Java 21 · PostgreSQL · Flyway · Actuator/Micrometer
├── web/                  React 19 · TypeScript · Vite · served by unprivileged nginx
├── docker-compose.yml    Full stack locally
├── infra/                ← Phase 2: Terraform (you build this)
├── deploy/               ← Phase 3: Helm chart + Argo CD apps (you build this)
└── .github/workflows/    ← Phase 1: CI pipeline (you build this)
```

## Run it locally

```bash
cp .env.example .env
docker compose up --build
```

| What | URL |
|---|---|
| Site | http://localhost:3000 |
| API status | http://localhost:8080/api/status |
| Health (readiness) | http://localhost:8081/actuator/health/readiness |
| Prometheus metrics | http://localhost:8081/actuator/prometheus |

Without Docker:

```bash
# API (needs a local Postgres, or run `docker compose up db`)
cd api && mvn spring-boot:run

# Web (proxies /api to :8080)
cd web && npm install && npm run dev      # http://localhost:5173
```

Run the API tests with `cd api && mvn verify`. The integration tests start PostgreSQL with Testcontainers, so Docker
must be running.

---

## Runtime contract (what the platform must provide)

This is the interface between the app and your infrastructure. Your Helm chart, Terraform and CI implement it.

### `cloudstory-api` image

| | |
|---|---|
| Port `8080` | Public HTTP API (`/api/**`). Route this through the ingress. |
| Port `8081` | Management only. **Do not expose it through the ingress.** |
| Liveness probe | `GET :8081/actuator/health/liveness` (does **not** check the database) |
| Readiness probe | `GET :8081/actuator/health/readiness` (checks the database) |
| Metrics | `GET :8081/actuator/prometheus` (scrape with a ServiceMonitor) |
| User | Runs as non-root UID `10001` |
| Shutdown | Graceful, about 20 s. Use `terminationGracePeriodSeconds: 30`. |
| Memory | JVM uses 75% of the container limit, so always set `resources.limits.memory`. |
| Startup | About 10–30 s (Flyway migrates on boot). Use a `startupProbe` or an initial delay. |

| Env var | Required | Purpose |
|---|---|---|
| `DB_URL` | yes | `jdbc:postgresql://<rds-endpoint>:5432/cloudstory` |
| `DB_USERNAME` / `DB_PASSWORD` | yes | From AWS Secrets Manager through External Secrets. Never put them in Git. |
| `APP_VERSION`, `GIT_COMMIT` | build args | Set by CI with `--build-arg`. Shown in the Operations Room. |
| `APP_ENVIRONMENT` | no | `dev`, `prod`, … |
| `DEPLOY_EVENT_TOKEN` | no | Shared secret CI uses to record deployments. Empty disables recording. |
| `PROMETHEUS_URL` | no | e.g. `http://kube-prometheus-stack-prometheus.monitoring:9090`. Empty means metrics are reported as "not connected". |
| `DB_POOL_SIZE` | no | Default 5. Keep `replicas × pool` under RDS `max_connections`. |
| `SPRING_PROFILES_ACTIVE` | no | The image defaults to `prod`, which gives JSON (ECS) logs. |

### `cloudstory-web` image

| | |
|---|---|
| Port `8080` | Static site (nginx, non-root) |
| Probe | `GET :8080/healthz` (works even if the API is down) |
| `API_UPSTREAM` | Where nginx forwards `/api/`. Default `http://api:8080`. In Kubernetes, either set it to the API Service or route `/api` to the API at the ingress. |
| `VITE_GITHUB_URL` | **Build arg**. Your repo link on the site. |

### Recording deployments from CI

After a deploy succeeds or fails, your pipeline (or an Argo CD notification/PostSync hook) calls:

```bash
curl -fsS -X POST "https://<your-domain>/api/deployments" \
  -H "Authorization: Bearer $DEPLOY_EVENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "service": "cloudstory-api",
        "version": "'"$VERSION"'",
        "commitSha": "'"$GITHUB_SHA"'",
        "environment": "dev",
        "status": "succeeded",
        "triggeredBy": "github-actions",
        "runUrl": "'"$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"'"
      }'
```

`status` is one of `started | succeeded | failed | rolled-back`. Only real pipeline runs create history, and the site
never shows simulated activity.

### API endpoints

| Method | Path | |
|---|---|---|
| GET | `/api/journey` | Pipeline story steps |
| GET | `/api/components` | Infrastructure map content |
| GET | `/api/status` | Version, commit, pod, uptime, DB state, Prometheus metrics (or why they're unavailable) |
| GET | `/api/deployments?limit=20` | Recorded deployment history |
| POST | `/api/deployments` | Record a deployment (bearer token) |

The Operations Room expects Micrometer's default metric names (`http_server_requests_seconds_*`,
`process_uptime_seconds`) with the label `application="cloudstory-api"`.

---

## Your DevOps roadmap

The full board is on the CloudStory Whiteboard. In short:

1. **CI (GitHub Actions)**: `mvn verify` and `npm run build` on PRs → build both images tagged with the git SHA →
   Trivy scan → push to ECR using **OIDC** (no stored AWS keys) → bump the tag in `deploy/` → POST the deploy event.
2. **Infrastructure (Terraform)**: S3 remote state with locking, then VPC (private subnets for nodes and RDS), EKS,
   ECR, RDS PostgreSQL, IAM roles for service accounts. One-command `apply` and `destroy`. Set an AWS Budget alert on day one.
3. **GitOps (Argo CD + Helm)**: a chart for api and web (probes, resources, HPA, PodDisruptionBudget), External Secrets
   for DB credentials, ingress with TLS, and app-of-apps.
4. **Observability**: kube-prometheus-stack, a ServiceMonitor on port 8081, a Grafana RED dashboard, and alerts for
   error rate and restart loops. Then set `PROMETHEUS_URL`. Break something on purpose and write a postmortem.
5. **Tell the story**: an architecture diagram, decision records, cost notes and a short demo video.

**Tip:** practise phases 1, 3 and 4 on a local `kind` or `k3d` cluster first. It's free, and moving to EKS later
becomes a Terraform exercise.
