import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createJob,
  getJob,
  listJobs,
  streamJobLogs,
  type JobStatus,
  type JobType,
  type OperatorJob,
  type ProverKind,
} from "../lib/operator";

type OperatorJobsState = {
  jobs: OperatorJob[];
  activeJobId: string | null;
  logs: string[];
  prover: ProverKind;
  setProver: (prover: ProverKind) => void;
  runJob: (type: JobType) => Promise<void>;
  selectJob: (id: string) => Promise<void>;
  refreshJobs: () => Promise<OperatorJob[]>;
  busy: boolean;
  lastStatus: JobStatus | null;
  jobError: string | null;
};

function parseJobError(message: string): string {
  try {
    const parsed = JSON.parse(message) as { detail?: string };
    if (parsed.detail) return parsed.detail;
  } catch {
    // plain text error body
  }
  return message;
}

export function useOperatorJobs(
  onComplete?: () => void,
  initialProver: ProverKind = "ezkl",
): OperatorJobsState {
  const [jobs, setJobs] = useState<OperatorJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [prover, setProver] = useState<ProverKind>(initialProver);
  const [lastStatus, setLastStatus] = useState<JobStatus | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const streamCleanup = useRef<(() => void) | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    setProver(initialProver);
  }, [initialProver]);

  const detachStream = useCallback(() => {
    streamCleanup.current?.();
    streamCleanup.current = null;
  }, []);

  const refreshJobs = useCallback(async () => {
    try {
      const next = await listJobs();
      setJobs(next);
      return next;
    } catch {
      return [];
    }
  }, []);

  const attachStream = useCallback(
    (jobId: string, status?: JobStatus) => {
      detachStream();
      if (status === "done" || status === "failed") return;

      streamCleanup.current = streamJobLogs(
        jobId,
        (line) => setLogs((prev) => [...prev, line]),
        (nextStatus) => {
          setLastStatus(nextStatus);
          void refreshJobs();
          if (nextStatus === "done") onComplete?.();
        },
        (message) => setLogs((prev) => [...prev, `[stream] ${message}`]),
      );
    },
    [detachStream, onComplete, refreshJobs],
  );

  const selectJob = useCallback(
    async (id: string) => {
      setActiveJobId(id);
      setJobError(null);
      try {
        const detail = await getJob(id);
        setLogs(detail.logs);
        setLastStatus(detail.status);
        attachStream(id, detail.status);
      } catch (err) {
        setLogs([
          `[operator] could not load job logs: ${err instanceof Error ? err.message : String(err)}`,
        ]);
      }
    },
    [attachStream],
  );

  useEffect(() => {
    void refreshJobs();
    const timer = window.setInterval(() => void refreshJobs(), 5000);
    return () => {
      window.clearInterval(timer);
      detachStream();
    };
  }, [refreshJobs, detachStream]);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    void (async () => {
      const next = await refreshJobs();
      const running = next.find((job) => job.status === "running" || job.status === "queued");
      if (running) await selectJob(running.id);
    })();
  }, [refreshJobs, selectJob]);

  const runJob = useCallback(
    async (type: JobType) => {
      setJobError(null);
      setLogs([]);
      setLastStatus(null);
      detachStream();

      try {
        const job = await createJob(type, prover);
        setActiveJobId(job.id);
        setJobs((prev) => [job, ...prev]);
        attachStream(job.id, job.status);
      } catch (err) {
        const message = parseJobError(err instanceof Error ? err.message : String(err));
        setJobError(message);
        setLogs([`[operator] job not started: ${message}`]);
      }
    },
    [prover, attachStream, detachStream],
  );

  const busy = useMemo(
    () => jobs.some((job) => job.status === "queued" || job.status === "running"),
    [jobs],
  );

  return {
    jobs,
    activeJobId,
    logs,
    prover,
    setProver,
    runJob,
    selectJob,
    refreshJobs,
    busy,
    lastStatus,
    jobError,
  };
}
