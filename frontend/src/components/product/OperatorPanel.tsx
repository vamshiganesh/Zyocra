import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OperatorJob, OperatorChainStatus } from "../../lib/operator";
import { fetchChainStatus, formatOperatorChainStatus } from "../../lib/operator";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccount, useChainId } from "wagmi";
import { useOperatorJobs } from "../../hooks/useOperatorJobs";
import { usePhase1Data } from "../../hooks/usePhase1Data";
import { useBenchmarkData } from "../../hooks/useBenchmarkData";
import { useChainStatus } from "../../hooks/useChainStatus";
import { chainReadsEnabled, readLiveChainStatus } from "../../lib/chain";
import type { ProverKind } from "../../types/phase1";
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

function parseProver(value: string | null): ProverKind | null {
  if (value === "circom" || value === "ezkl") return value;
  return null;
}

export function OperatorPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const { view, reload: reloadPhase1 } = usePhase1Data();
  const { reload: reloadBench } = useBenchmarkData();
  const jsonOracle = view?.raw.verification.oracle;
  const jsonConsumer = view?.raw.verification.consumer;
  const { live, error: walletChainError, loading: walletChainLoading, enabled, refresh: refreshChain } = useChainStatus({
    oracle: jsonOracle,
    consumer: jsonConsumer,
  });

  const initialProver = useMemo<ProverKind>(() => {
    const fromUrl = parseProver(new URLSearchParams(location.search).get("prover"));
    if (fromUrl) return fromUrl;
    return view?.prover ?? "ezkl";
  }, [location.search, view?.prover]);

  const {
    jobs,
    logs,
    prover,
    setProver,
    runJob,
    selectJob,
    resetQueue,
    busy,
    activeJobId,
    lastStatus,
    jobError,
  } = useOperatorJobs(() => {
    void reloadPhase1();
    void reloadBench();
    void refreshChain();
  }, initialProver);

  const logRef = useRef<HTMLPreElement>(null);
  const autoRunRef = useRef(false);
  const [operatorRpc, setOperatorRpc] = useState<string | null>(null);
  const [operatorChain, setOperatorChain] = useState<string | null>(null);
  const [operatorLive, setOperatorLive] = useState<OperatorChainStatus | null>(null);
  const [chainInspectLog, setChainInspectLog] = useState<string[]>([]);
  const [chainLoading, setChainLoading] = useState(false);
  const [chainFetchError, setChainFetchError] = useState<string | null>(null);
  const walletChainId = useChainId();
  const { isConnected } = useAccount();
  const deployJson = prover === "circom" ? "anvil-circom-oracle-latest.json" : "anvil-ezkl-latest.json";
  const deployScript =
    prover === "circom" ? "DeployCircomOracle.s.sol" : "DeployEzkl.s.sol";
  const submitScript =
    prover === "circom" ? "SubmitAndApplyCircom.s.sol" : "SubmitAndApply.s.sol";

  const loadOperatorChainStatus = useCallback(async () => {
    const status = await fetchChainStatus();
    const label = status.rpcLabel ?? status.rpcUrl;
    setOperatorRpc(label ? String(label) : null);
    setOperatorChain(String(status.chain ?? ""));
    setOperatorLive(status);
    return status;
  }, []);

  useEffect(() => {
    void loadOperatorChainStatus().catch(() => {
      setOperatorRpc(null);
      setOperatorChain(null);
      setOperatorLive(null);
    });
  }, [lastStatus, busy, loadOperatorChainStatus]);

  const handleChainStatus = async () => {
    setChainLoading(true);
    setChainFetchError(null);
    const lines: string[] = ["[chain] refreshing operator + wallet RPC reads…"];

    try {
      const status = await loadOperatorChainStatus();
      lines.push(...formatOperatorChainStatus(status));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lines.push(`[chain] operator API error: ${message}`);
      setChainFetchError(message);
    }

    try {
      await refreshChain();
      const walletEnabled = chainReadsEnabled({ oracle: jsonOracle, consumer: jsonConsumer });
      if (walletEnabled) {
        const walletLive = await readLiveChainStatus({ oracle: jsonOracle, consumer: jsonConsumer });
        if (walletLive) {
          lines.push(
            `[chain] wallet RPC (Sepolia) · epoch ${walletLive.latestEpoch}` +
              `${walletLive.scoreBps != null ? ` · score ${walletLive.scoreBps} bps` : ""}` +
              `${walletLive.collateralFactorBps != null ? ` · collateral ${walletLive.collateralFactorBps} bps` : ""}`,
          );
        }
      } else {
        lines.push("[chain] wallet RPC · set VITE_RPC_URL + VITE_ORACLE_ADDRESS for live reads");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lines.push(`[chain] wallet RPC error: ${message}`);
    }

    setChainInspectLog(lines);
    setChainLoading(false);
  };

  const operatorEpoch =
    operatorLive?.live?.latestEpoch ?? operatorLive?.loop?.epoch ?? 0;
  const operatorScoreBps =
    operatorLive?.live?.score?.scoreBps ?? operatorLive?.loop?.scoreBps;
  const operatorCollateral =
    operatorLive?.live?.borrowerPolicy?.collateralFactorBps ??
    operatorLive?.loop?.collateralFactorBps;

  const walletOnSepolia = isConnected && walletChainId === 11_155_111;
  const operatorOnAnvil = operatorChain === "anvil" || operatorRpc?.includes("127.0.0.1") === true;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlProver = parseProver(params.get("prover"));
    if (urlProver) setProver(urlProver);

    const shouldAutoRun = params.get("run") === "epoch";
    if (!shouldAutoRun) {
      autoRunRef.current = false;
      return;
    }

    if (!busy && !autoRunRef.current) {
      autoRunRef.current = true;
      void runJob("run_full_epoch");
      navigate("/operator", { replace: true });
    }
  }, [location.search, runJob, busy, navigate, setProver]);

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
        description="Local FastAPI service wrapping e2e_phase1.sh / e2e_circom.sh, forge deploy/submit, and make benchmark. Logs stream over SSE."
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

      <p className="operator-panel__note">
        {prover === "circom"
          ? "Circom: e2e_circom.sh · deploy → contracts/deployments/anvil-circom-oracle-latest.json"
          : "EZKL: e2e_phase1.sh · deploy → contracts/deployments/anvil-ezkl-latest.json"}
        {" · "}
        {deployScript} / {submitScript}
      </p>

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
        <ClippedButton
          type="button"
          variant="ghost"
          size="md"
          disabled={chainLoading || walletChainLoading}
          onClick={() => void handleChainStatus()}
        >
          {chainLoading || walletChainLoading ? "Chain status…" : "Chain status"}
        </ClippedButton>
        {busy ? (
          <ClippedButton type="button" variant="ghost" size="md" onClick={() => void resetQueue()}>
            Clear stuck jobs
          </ClippedButton>
        ) : null}
      </div>

      {operatorRpc ? (
        <div className="operator-panel__chain mono-label">
          Operator target: {operatorRpc}
          {operatorChain ? ` · ${operatorChain}` : ""}
          {walletOnSepolia && operatorOnAnvil
            ? " · wallet is Sepolia; deploy jobs broadcast to local Anvil"
            : ""}
        </div>
      ) : null}

      {jobError ? (
        <p className="operator-panel__note operator-panel__note--error">{jobError}</p>
      ) : null}

      {chainFetchError ? (
        <p className="operator-panel__note operator-panel__note--error">{chainFetchError}</p>
      ) : null}

      {walletChainError ? (
        <p className="operator-panel__note operator-panel__note--error">
          Wallet RPC: {walletChainError}
        </p>
      ) : null}

      {operatorLive ? (
        <div className="operator-panel__chain mono-label">
          Operator live
          {operatorEpoch > 0
            ? ` · epoch ${operatorEpoch}${operatorScoreBps != null ? ` · score ${operatorScoreBps} bps` : ""}${
                operatorCollateral != null ? ` · collateral ${operatorCollateral} bps` : ""
              }`
            : " · no verified epochs on operator RPC"}
        </div>
      ) : null}

      {enabled && live ? (
        <div className="operator-panel__chain mono-label">
          Wallet RPC (Sepolia) · epoch {live.latestEpoch}
          {live.scoreBps !== undefined ? ` · score ${live.scoreBps} bps` : ""}
          {live.collateralFactorBps !== undefined
            ? ` · collateral ${live.collateralFactorBps} bps`
            : ""}
        </div>
      ) : (
        <div className="operator-panel__chain mono-label">
          Wallet RPC: set VITE_RPC_URL + VITE_ORACLE_ADDRESS for Sepolia reads.
          {jsonOracle ? ` JSON oracle ${jsonOracle.slice(0, 10)}…` : ""}
        </div>
      )}

      {chainInspectLog.length > 0 ? (
        <pre className="operator-panel__chain-log mono-label">{chainInspectLog.join("\n")}</pre>
      ) : null}

      <div className="operator-panel__queue">
        <h3 className="operator-panel__queue-title">Job queue</h3>
        <ul className="operator-panel__jobs">
          {jobs.length === 0 ? (
            <li className="operator-panel__job operator-panel__job--empty">No jobs yet</li>
          ) : (
            jobs.map((job: OperatorJob) => (
              <li key={job.id}>
                <button
                  type="button"
                  className={`operator-panel__job${job.id === activeJobId ? " is-active" : ""}`}
                  onClick={() => void selectJob(job.id)}
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
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="operator-panel__terminal-wrap">
        <div className="operator-panel__terminal-head mono-label">
          Logs {lastStatus ? `· ${lastStatus}` : busy ? "· running" : ""}
          {!busy ? ` · ${deployJson}` : ""}
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
