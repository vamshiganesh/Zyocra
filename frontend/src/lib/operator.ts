const DEFAULT_API = "http://127.0.0.1:8787";

export const OPERATOR_API_URL =
  import.meta.env.VITE_OPERATOR_API_URL?.replace(/\/$/, "") ?? DEFAULT_API;

export type JobType =
  | "run_full_epoch"
  | "deploy_only"
  | "submit_apply"
  | "run_benchmark"
  | "prove_ezkl"
  | "prove_circom_head"
  | "sync_frontend";

export type ProverKind = "ezkl" | "circom";

export type JobStatus = "queued" | "running" | "done" | "failed";

export type OperatorJob = {
  id: string;
  type: JobType;
  prover: ProverKind;
  status: JobStatus;
  createdAt: number;
  startedAt?: number | null;
  finishedAt?: number | null;
  exitCode?: number | null;
  error?: string | null;
  durationSec?: number | null;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${OPERATOR_API_URL}${path}`, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function createJob(type: JobType, prover: ProverKind = "ezkl"): Promise<OperatorJob> {
  return api<OperatorJob>("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, prover }),
  });
}

export async function listJobs(): Promise<OperatorJob[]> {
  const data = await api<{ jobs: OperatorJob[] }>("/api/jobs");
  return data.jobs;
}

export async function getJob(id: string): Promise<OperatorJob & { logs: string[] }> {
  return api(`/api/jobs/${id}`);
}

export function streamJobLogs(
  id: string,
  onLine: (line: string) => void,
  onStatus: (status: JobStatus) => void,
  onError: (message: string) => void,
): () => void {
  const source = new EventSource(`${OPERATOR_API_URL}/api/jobs/${id}/stream`);

  source.onmessage = (event) => {
    onLine(event.data);
  };

  source.addEventListener("status", (event) => {
    onStatus(event.data as JobStatus);
    source.close();
  });

  source.addEventListener("error", () => {
    onError("log stream disconnected");
    source.close();
  });

  return () => source.close();
}

export type OperatorChainStatus = {
  chain?: string;
  rpcUrl?: string;
  rpcLabel?: string;
  hasDeployment?: boolean;
  addresses?: {
    oracle?: string;
    consumer?: string;
  };
  live?: {
    latestEpoch?: number;
    score?: {
      epoch?: number;
      scoreBps?: number;
      borrower?: string;
    };
    borrowerPolicy?: {
      collateralFactorBps?: number;
      borrowSpreadBps?: number;
      borrowAllowed?: boolean;
      lastEpoch?: number;
    };
  } | null;
  loop?: {
    epoch?: number;
    scoreBps?: number;
    collateralFactorBps?: number;
  };
  error?: string | null;
};

export function formatOperatorChainStatus(status: OperatorChainStatus): string[] {
  const lines: string[] = [];
  const target = status.rpcLabel ?? status.rpcUrl ?? "unknown RPC";
  lines.push(`[chain] operator target: ${target} (${status.chain ?? "?"})`);

  const oracle = status.addresses?.oracle;
  const consumer = status.addresses?.consumer;
  if (oracle) lines.push(`[chain] oracle ${oracle}`);
  if (consumer) lines.push(`[chain] consumer ${consumer}`);

  if (status.error) {
    lines.push(`[chain] operator read error: ${status.error}`);
    return lines;
  }

  const live = status.live;
  const loop = status.loop;
  const epoch = live?.latestEpoch ?? loop?.epoch;
  const scoreBps = live?.score?.scoreBps ?? loop?.scoreBps;
  const collateral =
    live?.borrowerPolicy?.collateralFactorBps ?? loop?.collateralFactorBps;

  if (epoch != null && epoch > 0) {
    lines.push(`[chain] operator live · epoch ${epoch}${scoreBps != null ? ` · score ${scoreBps} bps` : ""}`);
    if (collateral != null) lines.push(`[chain] operator collateral ${collateral} bps`);
  } else {
    lines.push("[chain] operator live · no verified epochs on operator RPC");
  }

  return lines;
}

export async function fetchChainStatus(): Promise<OperatorChainStatus> {
  return api<OperatorChainStatus>("/api/chain/status");
}

export async function resetOperatorJobs(): Promise<{ cancelled: string[]; count: number }> {
  return api("/api/jobs/reset", { method: "POST" });
}

export async function fetchArtifactsSummary() {
  return api<Record<string, unknown>>("/api/artifacts/summary");
}
