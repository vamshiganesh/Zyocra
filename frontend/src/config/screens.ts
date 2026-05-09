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
  pipelineStep?: number;
  sections: ScreenSection[];
};

export const SCREENS: Screen[] = [
  {
    path: "/",
    slug: "overview",
    title: "Overview",
    shortLabel: "Overview",
    eyebrow: "Verifiable risk oracle",
    headline: "Prove inference. Publish score. Adjust collateral.",
    lede: "Zyocra attests quantized LoRA-adapted risk inference off-chain, verifies on EVM, and benchmarks EZKL against a hand-optimized Circom path.",
    sections: [
      { id: "flow", label: "Pipeline", index: "01" },
      { id: "system", label: "Stack", index: "02" },
      { id: "metrics", label: "Benchmarks", index: "03" },
      { id: "entry", label: "Demo", index: "04" },
      { id: "faq", label: "FAQ", index: "05" },
    ],
  },
  {
    path: "/epoch",
    slug: "epoch",
    title: "Model Epoch Explorer",
    shortLabel: "Epoch",
    eyebrow: "Epoch registry",
    headline: "Commitments for the active scoring window.",
    lede: "Each epoch locks model hash, adapter hash, quantization profile, and verifier deployments before any borrower score is admitted.",
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
    headline: "Deterministic borrower features.",
    lede: "Tabular inputs from ml-base—fixed-point tensors aligned with the ONNX export and both proving paths.",
    pipelineStep: 2,
    sections: [
      { id: "vector", label: "Features", index: "01" },
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
    headline: "Generate the epoch proof.",
    lede: "Run EZKL on the full ONNX graph or Circom on the LoRA subgraph. Artifacts are content-addressed under circuits-baseline/ and circuits-custom/.",
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
    headline: "EVM verification gate.",
    lede: "Proof bytes and public inputs are checked against RiskScoreVerifierV1 before RiskOracle admits the score.",
    pipelineStep: 4,
    sections: [
      { id: "verifier", label: "Verifier", index: "01" },
      { id: "public-inputs", label: "Public inputs", index: "02" },
      { id: "simulation", label: "Simulation", index: "03" },
    ],
  },
  {
    path: "/score",
    slug: "score",
    title: "Risk Score Result",
    shortLabel: "Score",
    eyebrow: "Oracle output",
    headline: "Verified liquidation-risk score.",
    lede: "Fixed-point score, risk bucket, and quantization drift versus float32 reference from ml-base.",
    pipelineStep: 5,
    sections: [
      { id: "score", label: "Score", index: "01" },
      { id: "bucket", label: "Risk bucket", index: "02" },
      { id: "accuracy", label: "Quant drift", index: "03" },
    ],
  },
  {
    path: "/impact",
    slug: "impact",
    title: "Protocol Impact",
    shortLabel: "Impact",
    eyebrow: "Consumer contract",
    headline: "Collateral policy after verification.",
    lede: "RiskConsumer applies bucket policy—collateral factor, spread, borrow gate—without model-triggered liquidation.",
    pipelineStep: 6,
    sections: [
      { id: "consumer", label: "Consumer", index: "01" },
      { id: "params", label: "Deltas", index: "02" },
      { id: "audit", label: "Audit trail", index: "03" },
    ],
  },
  {
    path: "/benchmarks",
    slug: "benchmarks",
    title: "Benchmark Comparison",
    shortLabel: "Benchmarks",
    eyebrow: "Research artifact",
    headline: "EZKL vs Circom on one workload.",
    lede: "Constraint count, peak RAM, proof time, verification gas, proof size, and score quantization error—same inputs, documented machine spec.",
    sections: [
      { id: "comparison", label: "Comparison", index: "01" },
      { id: "methodology", label: "Methodology", index: "02" },
      { id: "raw", label: "Artifacts", index: "03" },
    ],
  },
  {
    path: "/threat-model",
    slug: "threat-model",
    title: "Threat Model",
    shortLabel: "Threat model",
    eyebrow: "Security scope",
    headline: "Guarantees and non-guarantees.",
    lede: "What the proof attests, what the oracle enforces, and what remains outside scope for market manipulation and data honesty.",
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
    headline: "Milestone log.",
    lede: "Oracle contract, EZKL pipeline, Circom benchmark path, and consumer risk logic—as each milestone lands in the repo.",
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
