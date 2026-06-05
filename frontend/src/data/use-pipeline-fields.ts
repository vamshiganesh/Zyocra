import { EMPTY_VALUE } from "../lib/display";
import { usePhase1Data } from "../hooks/usePhase1Data";
import { useChainStatus } from "../hooks/useChainStatus";
import type { ProverKind } from "../types/phase1";
import * as ph from "./product-placeholders";

/** Live phase-1 fields with static fallbacks when demo JSON is absent. */
export function usePipelineFields() {
  const { status, view, error, reload } = usePhase1Data();
  const jsonOracle = view?.raw.verification.oracle;
  const jsonConsumer = view?.raw.verification.consumer;
  const { live: chainLive, enabled: chainEnabled } = useChainStatus({
    oracle: jsonOracle,
    consumer: jsonConsumer,
  });

  const prover: ProverKind = view?.prover ?? "ezkl";

  const epochDetailFields = (view?.epochDetailFields ?? ph.epochDetailFields).map((field) => {
    if (!chainEnabled || !chainLive) return field;
    if (field.label === "Epoch ID" && chainLive.latestEpoch > 0) {
      return { ...field, value: `epoch-live-${chainLive.latestEpoch}`, hint: "live viem read" };
    }
    if (field.label === "Model hash" && chainLive.modelHash) {
      return { ...field, value: chainLive.modelHash.slice(0, 10) + "…", title: chainLive.modelHash, hint: "live" };
    }
    if (field.label === "Adapter hash" && chainLive.adapterHash) {
      return { ...field, value: chainLive.adapterHash.slice(0, 10) + "…", title: chainLive.adapterHash, hint: "live" };
    }
    return field;
  });

  const impactFields = (view?.impactFields ?? ph.impactFields).map((field) => {
    if (!chainEnabled || !chainLive) return field;
    if (field.label === "Collateral factor" && chainLive.collateralFactorBps !== undefined) {
      return {
        ...field,
        value: `${(chainLive.collateralFactorBps / 10_000).toFixed(2)}`,
        hint: "live",
      };
    }
    if (field.label === "Borrow spread" && chainLive.borrowSpreadBps !== undefined) {
      return { ...field, value: `${chainLive.borrowSpreadBps} bps`, hint: "live" };
    }
    if (field.label === "Borrow gate" && chainLive.borrowAllowed !== undefined) {
      return { ...field, value: chainLive.borrowAllowed ? "Allowed" : "Frozen", hint: "live" };
    }
    return field;
  });

  return {
    status,
    error,
    reload,
    live: view !== null,
    prover,
    chainLive,
    chainEnabled,
    epochId: view?.epochId ?? ph.demoEpoch.id,
    epochRegistry: view?.epochRegistry ?? ph.epochRegistry,
    epochDetailFields,
    inputFeatures: view?.inputFeatures ?? ph.inputFeatures,
    publicInputFields: view?.publicInputFields ?? ph.publicInputFields,
    artifactFields: view?.artifactFields ?? ph.ezklArtifactFields,
    verifyFields: view?.verifyFields ?? ph.verifyFields,
    verifierAdapterName: view?.verifierAdapterName ?? "EzklRiskScoreVerifier",
    verifierCoreName: view?.verifierCoreName ?? "Halo2Verifier (EZKL)",
    deployJsonName: view?.deployJsonName ?? "anvil-ezkl-latest.json",
    txSimFields: view?.txSimFields ?? [
      {
        label: "Caller",
        value: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        mono: true,
        description: "Foundry default deployer for local simulation.",
      },
      {
        label: "Target",
        value: "RiskOracle.submitScore",
        mono: true,
        description: "Oracle entrypoint after standalone verify() passes.",
      },
      {
        label: "Consumer",
        value: EMPTY_VALUE,
        mono: true,
        description: "RiskConsumer applying verified bucket policy.",
      },
      {
        label: "Result",
        value: EMPTY_VALUE,
        mono: true,
        description: "Simulated verifier outcome for attached proof bytes.",
      },
    ],
    scoreOutput: view?.scoreOutput ?? ph.scoreOutput,
    impactFields,
    auditTrail: view?.auditTrail ?? ph.auditTrail,
    headlineMetrics: view?.headlineMetrics,
    proofPanelStatus: view?.proofPanelStatus ?? ("idle" as const),
    verifyPanelStatus: view?.verifyPanelStatus ?? ("idle" as const),
    scoreFloat: view?.raw.score.float,
    scoreBucket: view?.raw.score.bucket ?? "MEDIUM",
    borrowerShort: view?.raw.consumer.borrowerShort ?? "0x9c4f…88a1",
    onChain: view?.raw.hasOnChain ?? false,
    collateralBps: view?.raw.consumer.collateralFactorBps,
    spreadBps: view?.raw.consumer.borrowSpreadBps,
    borrowAllowed: view?.raw.consumer.borrowAllowed,
    jsonOracle,
    jsonConsumer,
  };
}
