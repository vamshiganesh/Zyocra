import type { DataField, EpochRow } from "./product-placeholders";
import type { Phase1DemoJson, ProverKind } from "../types/phase1";
import { EMPTY_VALUE } from "../lib/display";

export type Phase1View = {
  raw: Phase1DemoJson;
  prover: ProverKind;
  epochId: string;
  epochRegistry: EpochRow[];
  epochDetailFields: DataField[];
  inputFeatures: DataField[];
  publicInputFields: DataField[];
  artifactFields: DataField[];
  verifyFields: DataField[];
  txSimFields: DataField[];
  scoreOutput: DataField[];
  impactFields: DataField[];
  auditTrail: DataField[];
  headlineMetrics: { label: string; value: string; detail: string; accent?: boolean }[];
  proofPanelStatus: "idle" | "ready" | "running" | "verified" | "sealed";
  verifyPanelStatus: "idle" | "ready" | "running" | "verified" | "sealed";
  verifierAdapterName: string;
  verifierCoreName: string;
  deployJsonName: string;
};

function fmtFloat(n: number, digits = 4): string {
  return n.toFixed(digits);
}

function fmtBpsFactor(bps: number): string {
  return (bps / 10_000).toFixed(2);
}

function addrOrDash(v?: string): string {
  return v && v.startsWith("0x") ? v : EMPTY_VALUE;
}

function resolveProver(proof: Phase1DemoJson["proof"]): ProverKind {
  if (proof.prover === "circom") return "circom";
  if (proof.artifactPath.includes("circuits-custom")) return "circom";
  return "ezkl";
}

export function buildPhase1View(raw: Phase1DemoJson): Phase1View {
  const { epoch, commitments, features, score, proof, verification, consumer } = raw;
  const prover = resolveProver(proof);
  const isCircom = prover === "circom";

  const proofStatusLabel =
    proof.status === "verified"
      ? "Verified"
      : proof.offChainVerify
        ? "Generated"
        : "Pending";

  const verifierStatusLabel =
    verification.onChain && verification.result === "pass"
      ? "On-chain pass"
      : proof.offChainVerify
        ? "Off-chain pass"
        : "Pending";

  const submissionStatus = verification.onChain ? "Submitted" : "Not submitted";

  const verifierAdapterName = isCircom ? "CircomRiskScoreVerifier" : "EzklRiskScoreVerifier";
  const verifierCoreName = isCircom ? "LoraHeadVerifier (Groth16)" : "Halo2Verifier (EZKL)";
  const deployJsonName = isCircom ? "anvil-circom-oracle-latest.json" : "anvil-ezkl-latest.json";

  const epochDetailFields: DataField[] = [
    {
      label: "Prover path",
      value: isCircom ? "Circom (LoRA head)" : "EZKL (full graph)",
      mono: true,
      description: isCircom
        ? "Groth16 head proof wired through CircomScoreEncoding on RiskOracle."
        : "Full ONNX graph compiled to Halo2 via EZKL.",
    },
    {
      label: "Epoch ID",
      value: epoch.id,
      mono: true,
      description: "Time-bounded scoring window bound to model and adapter commitments.",
      hint: `numeric · ${epoch.numeric}`,
    },
    {
      label: "Proof status",
      value: proofStatusLabel,
      mono: true,
      description: "Off-chain prover state; becomes verified after EVM admission.",
      hint: proof.artifactPath,
    },
    {
      label: "Verifier status",
      value: verifierStatusLabel,
      mono: true,
      description: isCircom
        ? "Groth16 verifier outcome on Anvil or local Foundry test."
        : "EZKL Halo2Verifier outcome on Anvil or local Foundry test.",
      hint: verification.onChain ? "broadcast" : "off-chain",
    },
    {
      label: "Model hash",
      value: commitments.modelHashShort,
      title: commitments.modelHash,
      mono: true,
      description: "Committed model identity registered on RiskOracle.",
    },
    {
      label: "Adapter hash",
      value: commitments.adapterHashShort,
      title: commitments.adapterHash,
      mono: true,
      description: "LoRA adapter commitment for this scoring epoch.",
    },
    ...(isCircom
      ? []
      : [
          {
            label: "ONNX commit",
            value: "zyocra-risk-mlp-v1",
            mono: true,
            description: "ml-base export artifact wired into EZKL compile.",
            hint: "artifacts/onnx/",
          } satisfies DataField,
        ]),
    {
      label: "Quantization profile",
      value: "Q8.8 · weight scale 256 · activation scale 128",
      mono: true,
      description: "Fixed-point scales shared by ml-base, EZKL settings, and Circom witness grids.",
    },
    {
      label: isCircom ? "Groth16 verifier" : "EZKL verifier",
      value: addrOrDash(verification.halo2Verifier),
      mono: true,
      description: isCircom
        ? "Deployed LoraHeadVerifier (snarkjs-generated Solidity)."
        : "Deployed Halo2Verifier (EZKL-generated Solidity).",
    },
    {
      label: "Oracle adapter",
      value: addrOrDash(verification.verifierAdapter),
      mono: true,
      description: `${verifierAdapterName} implementing IRiskScoreVerifier.`,
    },
  ];

  const inputFeatures: DataField[] = isCircom
    ? [
        {
          label: "hidden[0..7]",
          value: features.values.length > 0 ? `${features.values.length} limbs` : "8 limbs (off-chain)",
          description: "Backbone hidden vector fed to the LoRA output head. Not re-proven in the Circom subgraph.",
          hint: "circuits-custom head input",
        },
        {
          label: "logit_acc",
          value: score.logitAcc !== undefined ? String(score.logitAcc) : EMPTY_VALUE,
          mono: true,
          description: "Quantized accumulator output from the LoRA head circuit (public signal index 8).",
          hint: "Q8.8",
        },
        {
          label: "score binding",
          value: `${score.bps} bps`,
          mono: true,
          description: "On-chain scoreBps derived via CircomScoreEncoding cubic Taylor sigmoid over logit_acc.",
        },
      ]
    : features.names.map((name, i) => ({
        label: name,
        value: features.values[i] !== undefined ? fmtFloat(features.values[i], 4) : EMPTY_VALUE,
        description: "Min-max normalized feature from ml-base test split.",
        hint: `sample row ${features.sampleIndex}`,
      }));

  const publicInputFields: DataField[] = isCircom
    ? [
        {
          label: "hidden[0..7]",
          value: "8 public limbs",
          mono: true,
          description: "Witness-fed hidden states exposed as public signals in the Groth16 proof.",
        },
        {
          label: "logit_acc",
          value: score.logitAcc !== undefined ? String(score.logitAcc) : EMPTY_VALUE,
          mono: true,
          description: "Public signal at index 8; bound to scoreBps via CircomScoreEncoding.",
        },
        {
          label: "borrower limb",
          value: consumer.borrower,
          mono: true,
          description: "In-circuit public borrower limb (Groth16 statement).",
        },
        {
          label: "Public input count",
          value: score.publicInputCount !== undefined ? String(score.publicInputCount) : "10",
          mono: true,
          description: "logit_acc + hidden[8] + borrower (10 in-circuit public signals, snarkjs order).",
        },
        {
          label: "Model hash",
          value: commitments.modelHash,
          mono: true,
          description: "Committed at oracle deploy; must match payload.",
        },
        {
          label: "Adapter hash",
          value: commitments.adapterHash,
          mono: true,
          description: "LoRA adapter commitment for this epoch.",
        },
      ]
    : [
        {
          label: "borrower_id",
          value: consumer.borrower,
          mono: true,
          description: "Demo borrower for consumer policy application.",
        },
        {
          label: "Epoch ID",
          value: epoch.id,
          mono: true,
          description: "Must match oracle epoch at submission.",
        },
        {
          label: "Model hash",
          value: commitments.modelHash,
          mono: true,
          description: "Public commitment in verifier instance set.",
        },
        {
          label: "Adapter hash",
          value: commitments.adapterHash,
          mono: true,
          description: "Adapter commitment for this epoch.",
        },
      ];

  const artifactFields: DataField[] = isCircom
    ? [
        {
          label: "Prover",
          value: "Circom + snarkjs",
          mono: true,
          description: "LoRA output head Groth16 path.",
        },
        {
          label: "Proof size",
          value: proof.lengthBytes > 0 ? String(proof.lengthBytes) : EMPTY_VALUE,
          mono: true,
          description: "Serialized Groth16 proof byte length.",
          hint: "bytes",
        },
        {
          label: "Proof hash",
          value: proof.hashPrefix,
          mono: true,
          description: "Prefix of keccak256(proof bytes) for log correlation.",
        },
        {
          label: "Off-chain verify",
          value: proof.offChainVerify ? "PASS" : EMPTY_VALUE,
          mono: true,
          description: "snarkjs groth16.verify() on local artifacts.",
        },
        {
          label: "Artifact path",
          value: proof.artifactPath,
          mono: true,
          description: "Committed proof JSON under circuits-custom.",
        },
      ]
    : [
        {
          label: "EZKL version",
          value: proof.ezklVersion,
          mono: true,
          description: "Pinned prover toolchain.",
        },
        {
          label: "Proof size",
          value: proof.lengthBytes > 0 ? String(proof.lengthBytes) : EMPTY_VALUE,
          mono: true,
          description: "Serialized proof byte length.",
          hint: "bytes",
        },
        {
          label: "Proof hash",
          value: proof.hashPrefix,
          mono: true,
          description: "Prefix of keccak256(proof bytes) for log correlation.",
        },
        {
          label: "Off-chain verify",
          value: proof.offChainVerify ? "PASS" : EMPTY_VALUE,
          mono: true,
          description: "ezkl.verify() on local artifacts.",
        },
        {
          label: "Artifact path",
          value: proof.artifactPath,
          mono: true,
          description: "Committed proof JSON under circuits-baseline.",
        },
      ];

  const verifyFields: DataField[] = [
    {
      label: "Verifier contract",
      value: verifierAdapterName,
      mono: true,
      description: isCircom
        ? "Adapter to LoraHeadVerifier.verifyProof."
        : "Adapter to EZKL Halo2Verifier.verifyProof.",
    },
    {
      label: "Core verifier",
      value: verifierCoreName,
      mono: true,
      description: isCircom ? "Groth16 pairing check on BN254." : "Halo2 KZG verify on EVM.",
    },
    {
      label: "Verifier status",
      value: verifierStatusLabel,
      mono: true,
      description: "Outcome of proof verification.",
    },
    {
      label: "Chain ID",
      value: String(verification.chainId),
      mono: true,
      description: "Local Anvil chain for Phase 1 demos.",
      hint: "Anvil",
    },
    {
      label: "RiskOracle",
      value: addrOrDash(verification.oracle),
      mono: true,
      description: "Oracle receiving verified score updates.",
    },
    {
      label: "Proof hash",
      value: proof.hashPrefix,
      mono: true,
      description: "Proof bytes fingerprint at submission.",
    },
    {
      label: "Submission status",
      value: submissionStatus,
      mono: true,
      description: "RiskOracle.submitScore broadcast state.",
    },
  ];

  const txSimFields: DataField[] = [
    {
      label: "Caller",
      value: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      mono: true,
      description: "Anvil account #0 (deployer).",
    },
    {
      label: "Target",
      value: "RiskOracle.submitScore",
      mono: true,
      description: "Oracle entrypoint after verifier pass.",
    },
    {
      label: "Consumer",
      value: addrOrDash(verification.consumer),
      mono: true,
      description: "RiskConsumer applying verified bucket policy.",
    },
    {
      label: "Result",
      value: proof.offChainVerify ? "verify() → true" : EMPTY_VALUE,
      mono: true,
      description: "Verifier outcome for attached proof bytes.",
    },
  ];

  const scoreOutput: DataField[] = [
    {
      label: "Risk score",
      value: fmtFloat(score.float),
      description: "Verified liquidation-risk score (0–1).",
      hint: `${score.bps} bps`,
    },
    {
      label: "Score (bps)",
      value: String(score.bps),
      mono: true,
      description: "Basis points stored on RiskOracle.",
      hint: "10_000 = 1.00",
    },
    {
      label: "Risk bucket",
      value: score.bucket,
      mono: true,
      description: "Discrete policy band from RiskBuckets library.",
    },
    {
      label: "Bucket band",
      value: score.bucketRange,
      mono: true,
      description: "Inclusive lower bound for bucket classification.",
    },
    ...(isCircom
      ? [
          {
            label: "logit_acc",
            value: score.logitAcc !== undefined ? String(score.logitAcc) : EMPTY_VALUE,
            mono: true,
            description: "Quantized head output from Groth16 public signals.",
            hint: "public index 8",
          } satisfies DataField,
          {
            label: "CircomScoreEncoding",
            value: fmtFloat(score.float, 6),
            description: "Cubic Taylor sigmoid over dequantized logit_acc → scoreBps binding.",
            hint: "on-chain",
          } satisfies DataField,
        ]
      : [
          {
            label: "EZKL rescaled",
            value: fmtFloat(score.float, 6),
            description: "Witness rescaled output from proof.json.",
            hint: "public output",
          } satisfies DataField,
        ]),
  ];

  const collateral = fmtBpsFactor(consumer.collateralFactorBps);

  const impactFields: DataField[] = [
    {
      label: "Collateral factor",
      value: collateral,
      mono: true,
      description: "Maximum borrow power per unit collateral after epoch update.",
      hint: `${consumer.collateralFactorBps} bps`,
    },
    {
      label: "Borrow spread",
      value: consumer.borrowSpreadBps > 0 ? `+${consumer.borrowSpreadBps} bps` : "0 bps",
      mono: true,
      description: "Additional borrow rate premium for current bucket.",
    },
    {
      label: "New borrow allowed",
      value: consumer.borrowAllowed ? "true" : "false",
      mono: true,
      description: "HIGH/CRITICAL buckets freeze new borrows.",
    },
    {
      label: "Consumer tx",
      value: verification.onChain ? "applyVerifiedScore()" : "Pending",
      mono: true,
      description: "RiskConsumer policy update for demo borrower.",
    },
    {
      label: "Borrower",
      value: consumer.borrowerShort,
      mono: true,
      description: "Account receiving collateral parameter update.",
    },
  ];

  const auditTrail: DataField[] = [
    {
      label: "Oracle submission",
      value: verification.onChain ? `${epoch.id} · verified` : `${epoch.id} · ready`,
      mono: true,
      description: "RiskOracle.submitScore with proof and public inputs.",
    },
    {
      label: "Verified at epoch",
      value: verification.onChain ? String(consumer.lastEpoch) : EMPTY_VALUE,
      mono: true,
      description: "Latest committed epoch on oracle.",
    },
    {
      label: "Consumer update",
      value: verification.onChain ? "applyVerifiedScore()" : EMPTY_VALUE,
      mono: true,
      description: "Policy applied after ScoreVerified.",
    },
    {
      label: "Risk bucket",
      value: consumer.bucket,
      mono: true,
      description: "Classification driving collateral parameters.",
    },
    {
      label: "Collateral factor (bps)",
      value: String(consumer.collateralFactorBps),
      mono: true,
      description: "On-chain consumer policy output.",
    },
  ];

  const epochRegistry: EpochRow[] = [
    {
      id: epoch.id,
      status: verification.onChain ? "active" : "draft",
      modelHash: commitments.modelHashShort,
      adapterHash: commitments.adapterHashShort,
      verifier: isCircom ? "CIRCOM" : "EZKL",
      scoredAt: raw.syncedAt.slice(0, 10),
      borrowers: 1,
    },
  ];

  const headlineMetrics = [
    {
      label: "Prover",
      value: isCircom ? "Circom head" : "EZKL full",
      detail: isCircom ? "Groth16 oracle e2e" : "Halo2 oracle e2e",
      accent: true,
    },
    {
      label: "Latest epoch",
      value: epoch.id,
      detail: verification.onChain ? "On-chain" : "Local artifacts",
    },
    {
      label: "Risk score",
      value: fmtFloat(score.float),
      detail: `${score.bucket} · ${score.bps} bps`,
    },
    {
      label: "Proof status",
      value: proofStatusLabel,
      detail: proof.lengthBytes > 0 ? `${proof.lengthBytes} bytes` : EMPTY_VALUE,
    },
    {
      label: "Verification",
      value: verifierStatusLabel,
      detail: submissionStatus,
      accent: true,
    },
    {
      label: "Collateral factor",
      value: collateral,
      detail: `${consumer.bucket} bucket`,
    },
    {
      label: "Synced at",
      value: raw.syncedAt.replace("T", " ").replace("Z", " UTC"),
      detail: "phase1-demo.json",
    },
  ];

  const proofPanelStatus: Phase1View["proofPanelStatus"] = proof.offChainVerify
    ? verification.onChain
      ? "verified"
      : "ready"
    : "idle";

  const verifyPanelStatus: Phase1View["verifyPanelStatus"] = verification.onChain
    ? "verified"
    : proof.offChainVerify
      ? "ready"
      : "idle";

  return {
    raw,
    prover,
    epochId: epoch.id,
    epochRegistry,
    epochDetailFields,
    inputFeatures,
    publicInputFields,
    artifactFields,
    verifyFields,
    txSimFields,
    scoreOutput,
    impactFields,
    auditTrail,
    headlineMetrics,
    proofPanelStatus,
    verifyPanelStatus,
    verifierAdapterName,
    verifierCoreName,
    deployJsonName,
  };
}
