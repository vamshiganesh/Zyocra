import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  OperatorChainMode,
  OperatorJob,
  OperatorChainStatus,
  WalletSubmitPayload,
} from "../../lib/operator";
import {
  fetchChainMode,
  fetchChainStatus,
  fetchSubmitPayload,
  setChainMode,
} from "../../lib/operator";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useOperatorJobs } from "../../hooks/useOperatorJobs";
import { usePhase1Data } from "../../hooks/usePhase1Data";
import { useBenchmarkData } from "../../hooks/useBenchmarkData";
import { useChainStatus } from "../../hooks/useChainStatus";
import {
  chainReadsEnabled,
  envConsumerAddress,
  envOracleAddress,
  riskConsumerAbi,
  riskOracleAbi,
} from "../../lib/chain";
import type { ProverKind } from "../../types/phase1";
import { ClippedButton } from "../ui/ClippedButton";
import { ClippedCard } from "../ui/ClippedCard";
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
  const { live, error: walletChainError, loading: walletChainLoading, refresh: refreshChain } = useChainStatus({
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
  const [operatorChain, setOperatorChain] = useState<OperatorChainMode | null>(null);
  const [operatorLive, setOperatorLive] = useState<OperatorChainStatus | null>(null);
  const [sepoliaConfigured, setSepoliaConfigured] = useState(false);
  const [chainLoading, setChainLoading] = useState(false);
  const [modeBusy, setModeBusy] = useState(false);
  const [chainFetchError, setChainFetchError] = useState<string | null>(null);
  const [chainRefreshedAt, setChainRefreshedAt] = useState<number | null>(null);
  const [walletNote, setWalletNote] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [pendingApply, setPendingApply] = useState<WalletSubmitPayload | null>(null);
  const [submitHash, setSubmitHash] = useState<`0x${string}` | undefined>();
  const [applyHash, setApplyHash] = useState<`0x${string}` | undefined>();

  const walletChainId = useChainId();
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending: writePending } = useWriteContract();
  const submitReceipt = useWaitForTransactionReceipt({ hash: submitHash });
  const applyReceipt = useWaitForTransactionReceipt({ hash: applyHash });

  const deployJson =
    operatorChain === "sepolia"
      ? prover === "circom"
        ? "sepolia-circom-oracle-latest.json"
        : "sepolia-ezkl-latest.json"
      : prover === "circom"
        ? "anvil-circom-oracle-latest.json"
        : "anvil-ezkl-latest.json";
  const deployScript =
    prover === "circom" ? "DeployCircomOracle.s.sol" : "DeployEzkl.s.sol";
  const submitScript =
    prover === "circom" ? "SubmitAndApplyCircom.s.sol" : "SubmitAndApply.s.sol";

  const loadOperatorChainStatus = useCallback(async () => {
    const [mode, status] = await Promise.all([fetchChainMode(), fetchChainStatus(prover)]);
    const label = status.rpcLabel ?? status.rpcUrl ?? mode.rpcLabel ?? mode.rpcUrl;
    setOperatorRpc(label ? String(label) : null);
    setOperatorChain(mode.mode);
    setSepoliaConfigured(Boolean(mode.sepoliaConfigured));
    setOperatorLive(status);
    return status;
  }, [prover]);

  useEffect(() => {
    void loadOperatorChainStatus().catch(() => {
      setOperatorRpc(null);
      setOperatorChain(null);
      setOperatorLive(null);
    });
  }, [lastStatus, busy, loadOperatorChainStatus]);

  const handleChainMode = async (mode: OperatorChainMode) => {
    setModeBusy(true);
    setChainFetchError(null);
    try {
      await setChainMode(mode);
      await loadOperatorChainStatus();
      setChainRefreshedAt(Date.now());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setChainFetchError(message);
    } finally {
      setModeBusy(false);
    }
  };

  const handleChainStatus = async () => {
    setChainLoading(true);
    setChainFetchError(null);

    try {
      await loadOperatorChainStatus();
      await refreshChain();
      setChainRefreshedAt(Date.now());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setChainFetchError(message);
    } finally {
      setChainLoading(false);
    }
  };

  const handleWalletSubmitApply = async () => {
    setWalletError(null);
    setWalletNote(null);
    setSubmitHash(undefined);
    setApplyHash(undefined);
    setPendingApply(null);

    if (!isConnected || !address) {
      setWalletError("Connect a wallet first (top nav).");
      return;
    }
    if (operatorChain !== "sepolia") {
      setWalletError("Switch Operator to Sepolia before wallet submit.");
      return;
    }

    try {
      if (walletChainId !== 11_155_111) {
        await switchChainAsync({ chainId: 11_155_111 });
      }

      const ready = await fetchSubmitPayload(prover);
      if (!publicClient) {
        setWalletError("Public client unavailable — check VITE_RPC_URL.");
        return;
      }

      const authorized = await publicClient.readContract({
        address: ready.oracle as `0x${string}`,
        abi: riskOracleAbi,
        functionName: "authorizedProvers",
        args: [address],
      });
      if (!authorized) {
        setWalletError(
          `Wallet ${address.slice(0, 6)}…${address.slice(-4)} is not authorizedProver on this oracle. Use the deployer wallet or call setAuthorizedProver.`,
        );
        return;
      }

      setWalletNote(`Submitting epoch ${ready.payload.epoch} (${prover})… confirm in wallet`);
      setPendingApply(ready);

      const hash = await writeContractAsync({
        address: ready.oracle as `0x${string}`,
        abi: riskOracleAbi,
        functionName: "submitScore",
        args: [
          {
            modelHash: ready.payload.modelHash,
            adapterHash: ready.payload.adapterHash,
            epoch: BigInt(ready.payload.epoch),
            scoreBps: BigInt(ready.payload.scoreBps),
            borrower: ready.payload.borrower,
            proof: ready.payload.proof,
            publicInputs: ready.payload.publicInputs.map((x) => BigInt(x)),
          },
        ],
        chainId: 11_155_111,
      });
      setSubmitHash(hash);
      setWalletNote(`submitScore broadcast ${hash.slice(0, 10)}… — waiting for receipt`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setWalletError(message);
      setPendingApply(null);
    }
  };

  useEffect(() => {
    if (!submitReceipt.isSuccess || !pendingApply || applyHash) return;

    void (async () => {
      try {
        setWalletNote("submitScore confirmed — applying consumer policy…");
        const hash = await writeContractAsync({
          address: pendingApply.consumer as `0x${string}`,
          abi: riskConsumerAbi,
          functionName: "applyVerifiedScore",
          args: [pendingApply.apply.borrower, BigInt(pendingApply.apply.epoch)],
          chainId: 11_155_111,
        });
        setApplyHash(hash);
        setWalletNote(`applyVerifiedScore broadcast ${hash.slice(0, 10)}…`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setWalletError(message);
      }
    })();
  }, [submitReceipt.isSuccess, pendingApply, applyHash, writeContractAsync]);

  useEffect(() => {
    if (!applyReceipt.isSuccess || !applyHash) return;
    setWalletNote(
      `Done. submit ${submitHash?.slice(0, 10)}… · apply ${applyHash.slice(0, 10)}… — wallet must be authorizedProver and authorizedApplicator`,
    );
    setPendingApply(null);
    void refreshChain();
    void loadOperatorChainStatus();
  }, [applyReceipt.isSuccess, applyHash, submitHash, refreshChain, loadOperatorChainStatus]);

  const operatorEpoch =
    operatorLive?.live?.latestEpoch ?? operatorLive?.loop?.epoch ?? 0;
  const operatorScoreBps =
    operatorLive?.live?.score?.scoreBps ?? operatorLive?.loop?.scoreBps;
  const operatorCollateral =
    operatorLive?.live?.borrowerPolicy?.collateralFactorBps ??
    operatorLive?.loop?.collateralFactorBps;

  const walletOnSepolia = isConnected && walletChainId === 11_155_111;
  const operatorOnAnvil = operatorChain === "anvil";
  const operatorOnSepolia = operatorChain === "sepolia";
  const sepoliaEpoch = live?.latestEpoch ?? 0;
  const sepoliaHasScores = sepoliaEpoch > 0;
  const operatorOracle = operatorLive?.addresses?.oracle;
  const operatorConsumer = operatorLive?.addresses?.consumer;
  const sepoliaOracle = envOracleAddress ?? jsonOracle;
  const sepoliaConsumer = envConsumerAddress ?? jsonConsumer;
  const chainReadsOk = chainReadsEnabled({ oracle: jsonOracle, consumer: jsonConsumer });
  const walletTxBusy = writePending || Boolean(submitHash && !submitReceipt.isSuccess) || Boolean(applyHash && !applyReceipt.isSuccess);

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
        description="Local FastAPI service wrapping e2e_phase1.sh / e2e_circom.sh, forge deploy/submit, and make benchmark. Logs stream over SSE. Toggle Anvil vs Sepolia for Operator broadcast target."
      />

      <div className="operator-panel__toggle" role="group" aria-label="Prover path">
        <button
          type="button"
          className={`operator-panel__toggle-btn${prover === "ezkl" ? " is-active" : ""}`}
          onClick={() => setProver("ezkl")}
        >
          EZKL (full graph e2e)
        </button>
        <button
          type="button"
          className={`operator-panel__toggle-btn${prover === "circom" ? " is-active" : ""}`}
          onClick={() => setProver("circom")}
        >
          Circom (LoRA head e2e)
        </button>
      </div>

      <div className="operator-panel__toggle" role="group" aria-label="Operator chain">
        <button
          type="button"
          className={`operator-panel__toggle-btn${operatorOnAnvil ? " is-active" : ""}`}
          disabled={modeBusy || busy}
          onClick={() => void handleChainMode("anvil")}
        >
          Anvil (local)
        </button>
        <button
          type="button"
          className={`operator-panel__toggle-btn${operatorOnSepolia ? " is-active" : ""}`}
          disabled={modeBusy || busy || !sepoliaConfigured}
          onClick={() => void handleChainMode("sepolia")}
          title={sepoliaConfigured ? "Broadcast Operator jobs to Sepolia" : "Set SEPOLIA_RPC_URL + DEPLOYER_PRIVATE_KEY"}
        >
          Sepolia (testnet)
        </button>
      </div>

      <p className="operator-panel__note">
        {prover === "circom"
          ? "Circom e2e: LoRA head subgraph through RiskOracle (matched-head research path). Fair benchmark vs EZKL is make head-benchmark, not this toggle."
          : "EZKL e2e: full ONNX graph through RiskOracle (end-to-end score attestation). Matched head bakeoff lives on the Benchmarks page."}
        {" · "}
        {deployScript} / {submitScript}
        {operatorOnSepolia
          ? " · Sepolia: full epoch disabled — use Deploy only + Submit & apply, or shell scripts. Wallet can also sign submit/apply."
          : ""}
      </p>

      <div className="operator-panel__actions">
        <ClippedButton
          type="button"
          variant="accent"
          size="md"
          disabled={busy || operatorOnSepolia}
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
        <ClippedButton
          type="button"
          variant="accent"
          size="md"
          disabled={walletTxBusy || !operatorOnSepolia}
          onClick={() => void handleWalletSubmitApply()}
          title={
            operatorOnSepolia
              ? "MetaMask signs submitScore + applyVerifiedScore on Sepolia"
              : "Switch Operator to Sepolia first"
          }
        >
          {walletTxBusy ? "Wallet tx…" : "Wallet submit (Sepolia)"}
        </ClippedButton>
        {busy ? (
          <ClippedButton type="button" variant="ghost" size="md" onClick={() => void resetQueue()}>
            Clear stuck jobs
          </ClippedButton>
        ) : null}
      </div>

      {jobError ? (
        <p className="operator-panel__note operator-panel__note--error">{jobError}</p>
      ) : null}
      {walletError ? (
        <p className="operator-panel__note operator-panel__note--error">{walletError}</p>
      ) : null}
      {walletNote ? <p className="operator-panel__note">{walletNote}</p> : null}

      <ClippedCard className="operator-panel__chain-card" tone="surface">
        <div className="operator-panel__chain-summary">
          <div className="operator-panel__chain-head mono-label">
            Chain status
            {chainRefreshedAt
              ? ` · updated ${new Date(chainRefreshedAt).toLocaleTimeString()}`
              : ""}
            {chainLoading || walletChainLoading || modeBusy ? " · refreshing…" : ""}
          </div>

          {operatorRpc ? (
            <p className="operator-panel__chain mono-label">
              Operator ({operatorOnSepolia ? "Sepolia broadcast" : "Anvil demo"})
              {operatorEpoch > 0
                ? ` · epoch ${operatorEpoch}${operatorScoreBps != null ? ` · score ${operatorScoreBps} bps` : ""}${
                    operatorCollateral != null ? ` · collateral ${operatorCollateral} bps` : ""
                  }`
                : operatorOnSepolia
                  ? " · no verified epochs on operator Sepolia target — deploy + submit"
                  : " · no verified epochs — run full epoch"}
              {operatorRpc ? ` · ${operatorRpc}` : ""}
            </p>
          ) : null}

          {operatorOracle || operatorConsumer ? (
            <p className="operator-panel__chain mono-label operator-panel__chain--muted">
              Operator contracts ({prover})
              {operatorOracle ? ` · oracle ${operatorOracle}` : ""}
              {operatorConsumer ? ` · consumer ${operatorConsumer}` : ""}
            </p>
          ) : null}

          {chainReadsOk && live ? (
            <p className="operator-panel__chain mono-label">
              Frontend Sepolia reads (VITE_*)
              {sepoliaHasScores
                ? ` · epoch ${sepoliaEpoch}${live.scoreBps != null ? ` · score ${live.scoreBps} bps` : ""}${
                    live.collateralFactorBps != null ? ` · collateral ${live.collateralFactorBps} bps` : ""
                  }`
                : " · epoch 0 · contracts live, no score submitted yet"}
            </p>
          ) : (
            <p className="operator-panel__chain mono-label">
              Frontend Sepolia reads: set VITE_RPC_URL + VITE_ORACLE_ADDRESS.
            </p>
          )}

          {sepoliaOracle || sepoliaConsumer ? (
            <p className="operator-panel__chain mono-label operator-panel__chain--muted">
              VITE contracts
              {sepoliaOracle ? ` · oracle ${sepoliaOracle}` : ""}
              {sepoliaConsumer ? ` · consumer ${sepoliaConsumer}` : ""}
            </p>
          ) : null}

          {walletOnSepolia && operatorOnAnvil ? (
            <p className="operator-panel__chain mono-label operator-panel__chain--muted">
              Wallet on Sepolia — frontend reads live testnet; Operator still broadcasts to Anvil until you toggle Sepolia.
            </p>
          ) : null}

          {operatorOnSepolia && !walletOnSepolia && isConnected ? (
            <p className="operator-panel__chain mono-label operator-panel__chain--muted">
              Operator on Sepolia — switch wallet network to Sepolia before Wallet submit.
            </p>
          ) : null}

          {chainFetchError ? (
            <p className="operator-panel__note operator-panel__note--error">{chainFetchError}</p>
          ) : null}

          {walletChainError ? (
            <p className="operator-panel__note operator-panel__note--error">
              Wallet RPC: {walletChainError}
            </p>
          ) : null}
        </div>
      </ClippedCard>

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
        <ClippedCard tone="dark" padded={false} brackets={false}>
          <div className="operator-panel__terminal-head mono-label">
            Logs {lastStatus ? `· ${lastStatus}` : busy ? "· running" : ""}
            {!busy ? ` · ${deployJson}` : ""}
          </div>
          <pre ref={logRef} className="operator-panel__terminal" aria-live="polite">
            {logs.length === 0
              ? "Start a job to stream operator output…"
              : logs.join("\n")}
          </pre>
        </ClippedCard>
      </div>
    </div>
  );
}
