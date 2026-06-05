import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createJob,
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
  refreshJobs: () => Promise<void>;
  busy: boolean;
  lastStatus: JobStatus | null;
};

export function useOperatorJobs(
  onComplete?: () => void,
  initialProver: ProverKind = "ezkl",
): OperatorJobsState {
  const [jobs, setJobs] = useState<OperatorJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [prover, setProver] = useState<ProverKind>(initialProver);
  const [lastStatus, setLastStatus] = useState<JobStatus | null>(null);

  useEffect(() => {
    setProver(initialProver);
  }, [initialProver]);

  const refreshJobs = useCallback(async () => {
    try {
      const next = await listJobs();
      setJobs(next);
    } catch {
      // operator offline
    }
  }, []);

  useEffect(() => {
    void refreshJobs();
    const timer = window.setInterval(() => void refreshJobs(), 5000);
    return () => window.clearInterval(timer);
  }, [refreshJobs]);

  const runJob = useCallback(
    async (type: JobType) => {
      setLogs([]);
      setLastStatus(null);
      const job = await createJob(type, prover);
      setActiveJobId(job.id);
      setJobs((prev) => [job, ...prev]);

      streamJobLogs(
        job.id,
        (line) => setLogs((prev) => [...prev, line]),
        (status) => {
          setLastStatus(status);
          void refreshJobs();
          if (status === "done") onComplete?.();
        },
        (message) => setLogs((prev) => [...prev, `[stream] ${message}`]),
      );
    },
    [prover, refreshJobs, onComplete],
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
    refreshJobs,
    busy,
    lastStatus,
  };
}
