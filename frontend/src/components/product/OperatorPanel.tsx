import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePhase1Data } from "../../hooks/usePhase1Data";
import { useBenchmarkData } from "../../hooks/useBenchmarkData";
import { useChainStatus } from "../../hooks/useChainStatus";
import { ClippedButton } from "../ui/ClippedButton";
import { SectionHeader } from "../ui/SectionHeader";
import "./OperatorPanel.css";

const JOB_LABELS: Record<string, string> = {
  run_full_epoch: "Run full epoch",
  deploy_only: "Deploy only",
  submit_apply: "Submit & apply",
  run_benchmark: "Run benchmark",
  prove_ezkl: "Prove EZKL",
  prove_circom_head: "Prove Circom head",
};

export function OperatorPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const { reload: reloadPhase1 } = usePhase1Data();
  const { reload: reloadBench } = useBenchmarkData();
  const { live, enabled, refresh: refreshChain } = useChainStatus();
  const {
    jobs,
    logs,
    prover,
    setProver,
    runJob,
    busy,
    activeJobId,
    lastStatus,
  } = useOperatorJobs(() => {
    void reloadPhase1();
    void reloadBench();
    void refreshChain();
  });

  const logRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("run") === "epoch" && !busy) {
      void runJob("run_full_epoch");
      navigate("/operator", { replace: true });
    }
  }, [location.search, runJob, busy, navigate]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="operator-panel">
      <SectionHeader
        label="Operator"
        title="Run epoch demo"
        description="Local FastAPI service wrapping e2e_phase1.sh, forge deploy/submit, and make benchmark. Logs stream over SSE."
      />

      <div className="operator-panel__toggle" role="group" aria-label="Prover path">
        <button
          type="button"
          className={`operator-panel__toggle-btn${prover === "ezkl" ? " is-active" : ""}`}
          onClick={() => setProver("ezkl")}
        >
          EZKL (full graph)
        </button>
        <button
          type="button"
          className={`operator-panel__toggle-btn${prover === "circom" ? " is-active" : ""}`}
          onClick={() => setProver("circom")}
        >
          Circom (head)
        </button>
      </div>

      {prover === "circom" ? (
        <p className="operator-panel__note">
          Circom path runs head-only prove + benchmark. Not wired to RiskOracle submitScore.
        </p>
      ) : null}

      <div className="operator-panel__actions">
        <ClippedButton
          type="button"
          variant="accent"
          size="md"
          disabled={busy}
          onClick={() => void runJob("run_full_epoch")}
        >
          Run full epoch
        </ClippedButton>
        <ClippedButton
          type="button"
          variant="surface"
          size="md"
          disabled={busy}
          onClick={() => void runJob("deploy_only")}
        >
          Deploy only
        </ClippedButton>
        <ClippedButton
          type="button"
          variant="surface"
          size="md"
          disabled={busy}
          onClick={() => void runJob("submit_apply")}
        >
          Submit & apply
        </ClippedButton>
        <ClippedButton
          type="button"
          variant="surface"
          size="md"
          disabled={busy}
          onClick={() => void runJob("run_benchmark")}
        >
          Run benchmark
        </ClippedButton>
        <ClippedButton type="button" variant="ghost" size="md" onClick={() => void refreshChain()}>
          Chain status
        </ClippedButton>
      </div>

      {enabled && live ? (
        <div className="operator-panel__chain mono-label">
          Live · epoch {live.latestEpoch}
          {live.scoreBps !== undefined ? ` · score ${live.scoreBps} bps` : ""}
          {live.collateralFactorBps !== undefined
            ? ` · collateral ${live.collateralFactorBps} bps`
            : ""}
        </div>
      ) : (
        <div className="operator-panel__chain mono-label">
          Chain reads: set VITE_RPC_URL + VITE_ORACLE_ADDRESS for live viem reads.
        </div>
      )}

      <div className="operator-panel__queue">
        <h3 className="operator-panel__queue-title">Job queue</h3>
        <ul className="operator-panel__jobs">
          {jobs.length === 0 ? (
            <li className="operator-panel__job operator-panel__job--empty">No jobs yet</li>
          ) : (
            jobs.map((job) => (
              <li
                key={job.id}
                className={`operator-panel__job${job.id === activeJobId ? " is-active" : ""}`}
              >
                <span className={`operator-panel__status operator-panel__status--${job.status}`}>
                  {job.status}
                </span>
                <span className="operator-panel__job-type">{JOB_LABELS[job.type] ?? job.type}</span>
                <span className="operator-panel__job-meta mono-label">
                  {job.prover}
                  {job.durationSec != null ? ` · ${job.durationSec}s` : ""}
                  {job.exitCode != null && job.exitCode !== 0 ? ` · exit ${job.exitCode}` : ""}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="operator-panel__terminal-wrap">
        <div className="operator-panel__terminal-head mono-label">
          Logs {lastStatus ? `· ${lastStatus}` : busy ? "· running" : ""}
        </div>
        <pre ref={logRef} className="operator-panel__terminal" aria-live="polite">
          {logs.length === 0
            ? "Start a job to stream operator output…"
            : logs.join("\n")}
        </pre>
      </div>
    </div>
  );
}
