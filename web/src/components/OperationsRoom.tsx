import { CircleAlert, CircleCheck, Moon, RefreshCw } from "lucide-react";
import { useRemote, type DeploymentEvent, type Remote, type Status } from "../api";

const REFRESH_MS = 30_000;

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** A metric tile. A missing value is shown as missing, never filled in. */
function Metric({ label, value, unit, note }: { label: string; value: string | null; unit?: string; note?: string }) {
  return (
    <div className={`metric ${value === null ? "empty" : ""}`}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">
        {value ?? "—"}
        {value !== null && unit ? <small>{unit}</small> : null}
      </span>
      {value === null && note ? <span className="metric-note">{note}</span> : null}
    </div>
  );
}

export function OperationsRoom() {
  const status = useRemote<Status>("/api/status", REFRESH_MS);
  const deployments = useRemote<DeploymentEvent[]>("/api/deployments?limit=8", REFRESH_MS);

  const refresh = () => {
    void status.reload();
    void deployments.reload();
  };

  return (
    <section className="section" id="operations">
      <div className="section-label">04 / OPERATIONS ROOM</div>
      <h2>Is it actually running?</h2>
      <p className="section-description">
        Everything below is read live from the running system. If a number isn't available, it says so. Nothing here
        is simulated.
      </p>

      <div className="ops-panel">
        <div className="ops-header">
          <StatusPill value={status.value} />
          <button className="text-button" onClick={refresh}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {status.value.state === "loading" && <p className="ops-muted">Checking the cloud…</p>}

        {status.value.state === "unavailable" && (
          <div className="ops-offline">
            <Moon size={30} />
            <div>
              <h3>The cloud is sleeping.</h3>
              <p>
                I tear the AWS environment down between demos to keep costs near zero, so live data is paused right
                now. The rest of this site still works. Ask me for a live demo and I'll bring it up with one
                command.
              </p>
              <span className="ops-muted">Reason: {status.value.reason}</span>
            </div>
          </div>
        )}

        {status.value.state === "ok" && <LiveStatus status={status.value.data} />}

        {status.value.state === "ok" && (
          <div className="deploy-history">
            <h3>Recent deployments</h3>
            {deployments.value.state === "ok" && deployments.value.data.length === 0 && (
              <p className="ops-muted">No deployments recorded yet. The first pipeline run will appear here.</p>
            )}
            {deployments.value.state === "unavailable" && (
              <p className="ops-muted">Deployment history is unavailable: {deployments.value.reason}</p>
            )}
            {deployments.value.state === "ok" && deployments.value.data.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Service</th>
                      <th>Version</th>
                      <th>Commit</th>
                      <th>Env</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deployments.value.data.map((d) => (
                      <tr key={d.id}>
                        <td>{formatTime(d.createdAt)}</td>
                        <td>{d.service}</td>
                        <td>{d.version}</td>
                        <td>
                          {d.runUrl ? (
                            <a href={d.runUrl} target="_blank" rel="noopener noreferrer">
                              <code>{d.commitSha.slice(0, 7)}</code>
                            </a>
                          ) : (
                            <code>{d.commitSha.slice(0, 7)}</code>
                          )}
                        </td>
                        <td>{d.environment}</td>
                        <td>
                          <span className={`result result-${d.status}`}>{d.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function StatusPill({ value }: { value: Remote<Status> }) {
  if (value.state === "loading") return <span className="status-pill">Checking…</span>;
  if (value.state === "unavailable")
    return (
      <span className="status-pill offline">
        <Moon size={14} /> Offline
      </span>
    );
  const healthy = value.data.database === "up";
  return (
    <span className={`status-pill ${healthy ? "online" : "degraded"}`}>
      {healthy ? <CircleCheck size={14} /> : <CircleAlert size={14} />}
      {healthy ? "Live" : "Degraded: database unreachable"}
    </span>
  );
}

function LiveStatus({ status }: { status: Status }) {
  const m = status.metrics;
  const note = m.available ? "No traffic in the last 5 min" : (m.reason ?? "Not available");

  return (
    <>
      <div className="metric-grid">
        <Metric label="Environment" value={status.environment} />
        <Metric label="Version" value={status.version} />
        <Metric label="Commit" value={status.commit.slice(0, 7)} />
        <Metric label="Uptime" value={formatUptime(status.uptimeSeconds)} />
        <Metric label="Database" value={status.database} />
        <Metric label="Served by pod" value={status.pod} />
      </div>

      <h3 className="metrics-heading">Traffic (last 5 minutes, from Prometheus)</h3>
      <div className="metric-grid">
        <Metric
          label="Requests / sec"
          value={m.requestsPerSecond !== null ? m.requestsPerSecond.toFixed(2) : null}
          note={note}
        />
        <Metric
          label="Error rate"
          value={m.errorRatio !== null ? (m.errorRatio * 100).toFixed(2) : null}
          unit="%"
          note={note}
        />
        <Metric
          label="p95 latency"
          value={m.p95LatencyMs !== null ? m.p95LatencyMs.toFixed(0) : null}
          unit="ms"
          note={note}
        />
        <Metric label="API pods reporting" value={m.podsUp !== null ? String(m.podsUp) : null} note={note} />
      </div>
      <p className="ops-muted">
        Checked {formatTime(status.checkedAt)}
        {m.collectedAt ? ` · metrics collected ${formatTime(m.collectedAt)}` : ""}
      </p>
    </>
  );
}
