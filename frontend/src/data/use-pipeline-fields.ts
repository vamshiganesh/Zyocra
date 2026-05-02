import { usePhase1Data } from "../hooks/usePhase1Data";
import * as ph from "./product-placeholders";

/** Live phase-1 fields with static fallbacks when demo JSON is absent. */
export function usePipelineFields() {
  const { status, view, error, reload } = usePhase1Data();

  return {
    status,
    error,
    reload,
    live: view !== null,
    epochId: view?.epochId ?? ph.demoEpoch.id,
    epochRegistry: view?.epochRegistry ?? ph.epochRegistry,
    epochDetailFields: view?.epochDetailFields ?? ph.epochDetailFields,
    inputFeatures: view?.inputFeatures ?? ph.inputFeatures,
    publicInputFields: view?.publicInputFields ?? ph.publicInputFields,
    ezklArtifactFields: view?.ezklArtifactFields ?? ph.ezklArtifactFields,
    verifyFields: view?.verifyFields ?? ph.verifyFields,
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
        value: "—",
        mono: true,
        description: "RiskConsumer applying verified bucket policy.",
      },
      {
        label: "Result",
        value: "—",
        mono: true,
        description: "Simulated verifier outcome for attached proof bytes.",
      },
    ],
    scoreOutput: view?.scoreOutput ?? ph.scoreOutput,
    impactFields: view?.impactFields ?? ph.impactFields,
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
  };
}
