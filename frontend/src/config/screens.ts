export type ScreenSection = {
  id: string;
  label: string;
  index: string;
};

export type Screen = {
  path: string;
  slug: string;
  title: string;
  shortLabel: string;
  eyebrow: string;
  headline: string;
  lede: string;
  /** Ordered pipeline step (undefined for non-pipeline screens). */
  pipelineStep?: number;
  sections: ScreenSection[];
};

export const SCREENS: Screen[] = [
  {
    path: "/",
    slug: "overview",
    title: "Overview",
    shortLabel: "Overview",
    eyebrow: "Zyocra oracle",
    headline: "Prove risk scores. Update collateral.",
    lede: "Local-first zkML oracle for LoRA-adapted liquidation-risk inference—dual proving paths, on-chain verification, and a mock lending consumer.",
    sections: [
      { id: "flow", label: "Epoch flow", index: "01" },
      { id: "system", label: "System", index: "02" },
      { id: "metrics", label: "Headline metrics", index: "03" },
      { id: "entry", label: "Start epoch", index: "04" },
    ],
  },
  {
    path: "/epoch",
    slug: "epoch",
    title: "Model Epoch Explorer",
    shortLabel: "Epoch",
    eyebrow: "Epoch registry",
    headline: "Select the scoring epoch.",
    lede: "Each epoch binds a model hash, adapter commitments, quantization profile, and verifier deployment. Pick an epoch to inspect inputs and replay the prove→verify path.",
    pipelineStep: 1,
    sections: [
      { id: "active", label: "Active epoch", index: "01" },
      { id: "registry", label: "Registry", index: "02" },
      { id: "commitments", label: "Commitments", index: "03" },
    ],
  },
  {
    path: "/inputs",
    slug: "inputs",
    title: "Input Summary",
    shortLabel: "Inputs",
    eyebrow: "Feature vector",
    headline: "Borrower features for epoch scoring.",
    lede: "Deterministic tabular inputs exported from the ml-base pipeline—collateralization, utilization, volatility proxies, and wallet behavior summaries.",
    pipelineStep: 2,
    sections: [
      { id: "vector", label: "Feature vector", index: "01" },
      { id: "quantization", label: "Quantization", index: "02" },
      { id: "public-inputs", label: "Public inputs", index: "03" },
    ],
  },
  {
    path: "/prove",
    slug: "prove",
    title: "Proof Generation",
    shortLabel: "Prove",
    eyebrow: "Off-chain prover",
    headline: "Generate the epoch risk proof.",
    lede: "Run EZKL baseline or Circom custom path against the committed ONNX graph and LoRA delta. Artifacts land in circuits-baseline/ or circuits-custom/.",
    pipelineStep: 3,
    sections: [
      { id: "path", label: "Proving path", index: "01" },
      { id: "prover", label: "Prover run", index: "02" },
      { id: "artifacts", label: "Artifacts", index: "03" },
    ],
  },
  {
    path: "/verify",
    slug: "verify",
    title: "Proof Verification",
    shortLabel: "Verify",
    eyebrow: "On-chain verifier",
    headline: "Verify the proof on EVM.",
    lede: "Submit proof bytes and public inputs to the deployed Solidity verifier. Oracle contract rejects mismatched model, adapter, or epoch commitments.",
    pipelineStep: 4,
    sections: [
      { id: "verifier", label: "Verifier", index: "01" },
      { id: "public-inputs", label: "Public inputs", index: "02" },
      { id: "simulation", label: "Tx simulation", index: "03" },
    ],
  },
  {
    path: "/score",
    slug: "score",
    title: "Risk Score Result",
    shortLabel: "Score",
    eyebrow: "Oracle output",
    headline: "Verified liquidation-risk score.",
    lede: "Fixed-point score and risk bucket emitted by the oracle after successful verification. Compared against float32 reference from ml-base evaluation.",
    pipelineStep: 5,
    sections: [
      { id: "score", label: "Score output", index: "01" },
      { id: "bucket", label: "Risk bucket", index: "02" },
      { id: "accuracy", label: "Quantization drift", index: "03" },
    ],
  },
  {
    path: "/impact",
    slug: "impact",
    title: "Protocol Impact",
    shortLabel: "Impact",
    eyebrow: "Consumer contract",
    headline: "Collateral parameters after verification.",
    lede: "Mock lending consumer maps verified risk buckets to collateral factor, borrow spread, and borrow freeze flags—no model-triggered liquidation.",
    pipelineStep: 6,
    sections: [
      { id: "consumer", label: "Consumer state", index: "01" },
      { id: "params", label: "Parameter delta", index: "02" },
      { id: "audit", label: "Audit trail", index: "03" },
    ],
  },
  {
    path: "/benchmarks",
    slug: "benchmarks",
    title: "Benchmark Comparison",
    shortLabel: "Benchmarks",
    eyebrow: "Research artifact",
    headline: "EZKL baseline vs Circom LoRA path.",
    lede: "Apples-to-apples comparison on constraint count, prover RAM, proof time, verification gas, proof size, and float vs fixed-point error.",
    sections: [
      { id: "comparison", label: "Comparison", index: "01" },
      { id: "methodology", label: "Methodology", index: "02" },
      { id: "raw", label: "Raw results", index: "03" },
    ],
  },
  {
    path: "/threat-model",
    slug: "threat-model",
    title: "Threat Model",
    shortLabel: "Threat model",
    eyebrow: "Security scope",
    headline: "Guarantees and explicit non-guarantees.",
    lede: "What the proof system attests, what the oracle enforces on-chain, and what remains outside scope for market manipulation or data honesty.",
    sections: [
      { id: "guarantees", label: "Guarantees", index: "01" },
      { id: "non-guarantees", label: "Non-guarantees", index: "02" },
      { id: "assumptions", label: "Assumptions", index: "03" },
    ],
  },
  {
    path: "/updates",
    slug: "updates",
    title: "Changelog",
    shortLabel: "Updates",
    eyebrow: "Release notes",
    headline: "Milestone and circuit updates.",
    lede: "Versioned changes across ml-base, circuits-baseline, circuits-custom, contracts, and benchmarks as the repository advances.",
    sections: [{ id: "changelog", label: "Changelog", index: "01" }],
  },
];

export const PIPELINE_SCREENS = SCREENS.filter(
  (s): s is Screen & { pipelineStep: number } => s.pipelineStep !== undefined,
).sort((a, b) => a.pipelineStep - b.pipelineStep);

export function screenForPath(pathname: string): Screen {
  const match = SCREENS.find(
    (s) => s.path === pathname || (s.path !== "/" && pathname.startsWith(s.path)),
  );
  return match ?? SCREENS[0];
}

export function screenBySlug(slug: string): Screen | undefined {
  return SCREENS.find((s) => s.slug === slug);
}
