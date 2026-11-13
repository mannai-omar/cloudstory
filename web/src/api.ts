import { useCallback, useEffect, useState } from "react";

export type JourneyStep = {
  position: number;
  name: string;
  tool: string;
  description: string;
};

export type Layer = "source" | "delivery" | "aws" | "cluster" | "observability";

export type InfraComponent = {
  slug: string;
  name: string;
  layer: Layer;
  tool: string;
  description: string;
  why: string;
  position: number;
};

export type DeploymentEvent = {
  id: number;
  service: string;
  version: string;
  commitSha: string;
  environment: string;
  status: "started" | "succeeded" | "failed" | "rolled-back";
  triggeredBy: string | null;
  runUrl: string | null;
  createdAt: string;
};

export type MetricsSnapshot = {
  available: boolean;
  reason: string | null;
  requestsPerSecond: number | null;
  errorRatio: number | null;
  p95LatencyMs: number | null;
  podsUp: number | null;
  collectedAt: string | null;
};

export type Status = {
  service: string;
  version: string;
  commit: string;
  environment: string;
  pod: string;
  startedAt: string;
  uptimeSeconds: number;
  database: "up" | "down";
  metrics: MetricsSnapshot;
  checkedAt: string;
};

export type Remote<T> =
  | { state: "loading" }
  | { state: "ok"; data: T }
  | { state: "unavailable"; reason: string };

const TIMEOUT_MS = 4000;

async function getJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(path, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get("content-type") ?? "";
    // A static host without the API often answers with index.html; that is not data.
    if (!type.includes("json")) throw new Error("No API behind this site");
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Fetches from the API. Never invents data: on failure the caller gets "unavailable" and a reason. */
export function useRemote<T>(path: string, refreshMs?: number) {
  const [value, setValue] = useState<Remote<T>>({ state: "loading" });

  const load = useCallback(async () => {
    try {
      const data = await getJson<T>(path);
      setValue({ state: "ok", data });
    } catch (error) {
      const reason =
        error instanceof DOMException && error.name === "AbortError"
          ? "The API did not answer in time."
          : error instanceof Error
            ? error.message
            : "Unknown error";
      setValue({ state: "unavailable", reason });
    }
  }, [path]);

  useEffect(() => {
    void load();
    if (!refreshMs) return;
    const id = window.setInterval(() => void load(), refreshMs);
    return () => window.clearInterval(id);
  }, [load, refreshMs]);

  return { value, reload: load };
}
