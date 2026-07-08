import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  OperatorChainMode,
  OperatorJob,
  OperatorChainStatus,
} from "../../lib/operator";
import {
  authorizeWallet,
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

const WALLET_TX_LOG_KEY = "zyocra.operator.walletTxLog";
const ETHERSCAN_TX = "https://sepolia.etherscan.io/tx/";

type WalletTxEntry = {
  id: string;
  at: number;
  step: string;
  hash: `0x${string}`;
  prover: ProverKind;
  oracle?: string;
  consumer?: string;
  epoch?: number;
  scoreBps?: number;
  status: "pending" | "confirmed" | "failed";
  error?: string;
};

function parseProver(value: string | null): ProverKind | null {
  if (value === "circom" || value === "ezkl") return value;
  return null;
}

function loadWalletTxLog(): WalletTxEntry[] {
  try {
    const raw = localStorage.getItem(WALLET_TX_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WalletTxEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, 40) : [];
  } catch {
    return [];
  }
}

function persistWalletTxLog(entries: WalletTxEntry[]) {
  localStorage.setItem(WALLET_TX_LOG_KEY, JSON.stringify(entries.slice(0, 40)));
}

function shortHash(hash: string): string {
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
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
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletTxLog, setWalletTxLog] = useState<WalletTxEntry[]>(() => loadWalletTxLog());
  const walletFlowId = useRef(0);

  const walletChainId = useChainId();
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const pushWalletTx = useCallback((entry: Omit<WalletTxEntry, "id" | "at">) => {
    const full: WalletTxEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      at: Date.now(),
    };
    setWalletTxLog((prev) => {
      const next = [full, ...prev].slice(0, 40);
      persistWalletTxLog(next);
      return next;
    });
    return full.id;
  }, []);

  const patchWalletTx = useCallback((id: string, patch: Partial<WalletTxEntry>) => {
    setWalletTxLog((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
      persistWalletTxLog(next);
      return next;
    });
  }, []);

  const clearWalletTxLog = () => {
    setWalletTxLog([]);
    localStorage.removeItem(WALLET_TX_LOG_KEY);
  };

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

    if (!isConnected || !address) {
      setWalletError("Connect a wallet first (top nav).");
      return;
    }
    if (operatorChain !== "sepolia") {
      setWalletError("Switch Operator to Sepolia before wallet submit.");
      return;
    }
    if (!publicClient) {
      setWalletError("Public client unavailable — check VITE_RPC_URL.");
      return;
    }

    setWalletBusy(true);
    const flowId = ++walletFlowId.current;
    try {
      if (walletChainId !== 11_155_111) {
        await switchChainAsync({ chainId: 11_155_111 });
      }
      if (flowId !== walletFlowId.current) return;

      const ready = await fetchSubmitPayload(prover);
      if (flowId !== walletFlowId.current) return;

      const authorized = await publicClient.readContract({
        address: ready.oracle as `0x${string}`,
        abi: riskOracleAbi,
        functionName: "authorizedProvers",
        args: [address],
      });
      if (!authorized) {
        setWalletNote(
          `Wallet ${address.slice(0, 6)}…${address.slice(-4)} not yet authorized — granting prover+applicator via deployer…`,
        );
        const grant = await authorizeWallet(address, prover);
        if (flowId !== walletFlowId.current) return;
        for (const hash of grant.txHashes) {
          pushWalletTx({
            step: "setAuthorizedProver/Applicator",
            hash: hash.startsWith("0x") ? (hash as `0x${string}`) : (`0x${hash}` as `0x${string}`),
            prover,
            oracle: grant.oracle,
            consumer: grant.consumer,
            status: "confirmed",
          });
        }
        if (!grant.alreadyAuthorized && grant.txHashes.length > 0) {
          setWalletNote(
            `Authorized ${address.slice(0, 6)}… · ${grant.txHashes.length} tx(s) — submitting epoch…`,
          );
        }
      }

      setWalletNote(`Submitting epoch ${ready.payload.epoch} (${prover})… confirm in MetaMask`);
      const submitHash = await writeContractAsync({
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
      if (flowId !== walletFlowId.current) return;
      const submitLogId = pushWalletTx({
        step: "submitScore",
        hash: submitHash,
        prover,
        oracle: ready.oracle,
        consumer: ready.consumer,
        epoch: ready.payload.epoch,
        scoreBps: ready.payload.scoreBps,
        status: "pending",
      });
      setWalletNote(`submitScore ${shortHash(submitHash)} — waiting for receipt…`);

      const submitReceipt = await publicClient.waitForTransactionReceipt({
        hash: submitHash,
        confirmations: 1,
        timeout: 180_000,
      });
      if (flowId !== walletFlowId.current) return;
      if (submitReceipt.status !== "success") {
        patchWalletTx(submitLogId, { status: "failed", error: "reverted on-chain" });
        throw new Error(`submitScore reverted (${shortHash(submitHash)})`);
      }
      patchWalletTx(submitLogId, { status: "confirmed" });

      setWalletNote("submitScore confirmed — applying consumer policy… confirm in MetaMask");
      const applyHash = await writeContractAsync({
        address: ready.consumer as `0x${string}`,
        abi: riskConsumerAbi,
        functionName: "applyVerifiedScore",
        args: [ready.apply.borrower, BigInt(ready.apply.epoch)],
        chainId: 11_155_111,
      });
      if (flowId !== walletFlowId.current) return;
      const applyLogId = pushWalletTx({
        step: "applyVerifiedScore",
        hash: applyHash,
        prover,
        oracle: ready.oracle,
        consumer: ready.consumer,
        epoch: ready.apply.epoch,
        scoreBps: ready.payload.scoreBps,
        status: "pending",
      });
      setWalletNote(`applyVerifiedScore ${shortHash(applyHash)} — waiting for receipt…`);

      const applyReceipt = await publicClient.waitForTransactionReceipt({
        hash: applyHash,
        confirmations: 1,
        timeout: 180_000,
      });
      if (flowId !== walletFlowId.current) return;
      if (applyReceipt.status !== "success") {
        patchWalletTx(applyLogId, { status: "failed", error: "reverted on-chain" });
        throw new Error(`applyVerifiedScore reverted (${shortHash(applyHash)})`);
      }
      patchWalletTx(applyLogId, { status: "confirmed" });

      setWalletNote(
        `Done · submit ${shortHash(submitHash)} · apply ${shortHash(applyHash)} — see On-chain tx log`,
      );
      await refreshChain();
      await loadOperatorChainStatus();
      setChainRefreshedAt(Date.now());
    } catch (err) {
      if (flowId !== walletFlowId.current) return;
      const message = err instanceof Error ? err.message : String(err);
      setWalletError(message);
    } finally {
      if (flowId === walletFlowId.current) setWalletBusy(false);
    }
  };
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
          ? " · Sepolia: full epoch disabled — use Deploy only + Submit & apply, or shell scripts. Wallet submit auto-grants ACL to your MetaMask via the deployer key."
          : " · Anvil: Operator forge jobs hit local Anvil (auto-starts if needed). Wallet submit is Sepolia-only."}
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
          disabled={walletBusy || !operatorOnSepolia}
          onClick={() => void handleWalletSubmitApply()}
          title={
            operatorOnSepolia
              ? "MetaMask signs submitScore + applyVerifiedScore on Sepolia"
              : "Switch Operator to Sepolia first"
          }
        >
          {walletBusy ? "Wallet tx…" : "Wallet submit (Sepolia)"}
        </ClippedButton>
        {walletBusy ? (
          <ClippedButton
            type="button"
            variant="ghost"
            size="md"
            onClick={() => {
              walletFlowId.current += 1;
              setWalletBusy(false);
              setWalletNote("Wallet flow cancelled — you can try again (check MetaMask pending txs).");
            }}
          >
            Cancel wallet wait
          </ClippedButton>
        ) : null}
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

      {walletTxLog.length > 0 ? (
        <ClippedCard className="operator-panel__tx-card" tone="surface">
          <div className="operator-panel__chain-summary">
            <div className="operator-panel__chain-head mono-label">
              On-chain wallet tx log
              <button
                type="button"
                className="operator-panel__tx-clear"
                onClick={clearWalletTxLog}
              >
                Clear
              </button>
            </div>
            <ul className="operator-panel__tx-list">
              {walletTxLog.map((tx) => (
                <li key={tx.id} className="operator-panel__tx-row mono-label">
                  <span className={`operator-panel__tx-status operator-panel__tx-status--${tx.status}`}>
                    {tx.status}
                  </span>
                  <span className="operator-panel__tx-step">{tx.step}</span>
                  <span className="operator-panel__tx-meta">
                    {tx.prover}
                    {tx.epoch != null ? ` · epoch ${tx.epoch}` : ""}
                    {tx.scoreBps != null ? ` · ${tx.scoreBps} bps` : ""}
                    {` · ${new Date(tx.at).toLocaleTimeString()}`}
                  </span>
                  <a
                    className="operator-panel__tx-link"
                    href={`${ETHERSCAN_TX}${tx.hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {shortHash(tx.hash)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </ClippedCard>
      ) : null}

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
