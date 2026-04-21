export type DataField = {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
};

export type EpochRow = {
  id: string;
  status: "active" | "sealed" | "draft";
  modelHash: string;
  adapterHash: string;
  verifier: string;
  scoredAt: string;
  borrowers: number;
};

export const demoEpoch = {
  id: "epoch-2026-041",
  status: "active" as const,
  modelHash: "0x8f3c…a91e",
  adapterHash: "0x2b17…04d8",
  onnxCommit: "sha256:6c4e1f…b203",
  quantProfile: "Q8.8 / scale 256",
  verifierEzkl: "0x41A2…E7C0",
  verifierCircom: "0x9D10…3F22",
  blockHeight: "21_884_102",
  scoredAt: "2026-04-01T00:00:00Z",
};

export const epochRegistry: EpochRow[] = [
  {
    id: "epoch-2026-041",
    status: "active",
    modelHash: "0x8f3c…a91e",
    adapterHash: "0x2b17…04d8",
    verifier: "EZKL + Circom",
    scoredAt: "2026-04-01",
    borrowers: 128,
  },
  {
    id: "epoch-2026-040",
    status: "sealed",
    modelHash: "0x8f3c…a91e",
    adapterHash: "0x2b17…04d8",
    verifier: "EZKL",
    scoredAt: "2026-03-25",
    borrowers: 126,
  },
  {
    id: "epoch-2026-039",
    status: "sealed",
    modelHash: "0x7a11…c002",
    adapterHash: "0x2b17…04d8",
    verifier: "Circom",
    scoredAt: "2026-03-18",
    borrowers: 119,
  },
];

export const inputFeatures: DataField[] = [
  { label: "collateralization_ratio", value: "1.42", hint: "ETH/USDC position" },
  { label: "debt_utilization", value: "0.68", hint: "borrowed / limit" },
  { label: "volatility_proxy_7d", value: "0.31", hint: "annualized σ" },
  { label: "liquidation_proximity", value: "0.12", hint: "distance to threshold" },
  { label: "borrow_concentration", value: "0.44", hint: "Herfindahl proxy" },
  { label: "wallet_age_days", value: "412", hint: "first seen on-chain" },
];

export const quantizationFields: DataField[] = [
  { label: "weight_scale", value: "256", mono: true },
  { label: "activation_scale", value: "128", mono: true },
  { label: "accumulator_bits", value: "32", mono: true },
  { label: "lora_rank", value: "8", mono: true },
  { label: "effective_weights", value: "W′ = W + AB", mono: true },
];

export const publicInputFields: DataField[] = [
  { label: "borrower_id", value: "0x9c4f…88a1", mono: true },
  { label: "epoch_id", value: "epoch-2026-041", mono: true },
  { label: "model_commitment", value: demoEpoch.modelHash, mono: true },
  { label: "adapter_commitment", value: demoEpoch.adapterHash, mono: true },
];

export const proveRun = {
  path: "ezkl" as const,
  status: "ready" as const,
  constraints: "—",
  peakRam: "—",
  proofTime: "—",
  proofSize: "—",
  artifactPath: "circuits-baseline/proofs/epoch-2026-041.json",
};

export const circomRun = {
  path: "circom" as const,
  status: "ready" as const,
  constraints: "—",
  peakRam: "—",
  proofTime: "—",
  proofSize: "—",
  artifactPath: "circuits-custom/proofs/epoch-2026-041.json",
};

export const verifyFields: DataField[] = [
  { label: "verifier_contract", value: "RiskScoreVerifierV1", mono: true },
  { label: "chain_id", value: "31337 (Anvil)", mono: true },
  { label: "verify_gas", value: "—", hint: "Foundry gas snapshot" },
  { label: "proof_hash", value: "0x1e90…c4af", mono: true },
  { label: "submission_status", value: "Simulated — not submitted", mono: true },
];

export const scoreOutput: DataField[] = [
  { label: "risk_score_q8", value: "0.742", hint: "fixed-point export" },
  { label: "risk_score_float_ref", value: "0.739", hint: "ml-base eval" },
  { label: "absolute_error", value: "0.003", hint: "|float − fixed|" },
  { label: "risk_bucket", value: "MEDIUM", mono: true },
  { label: "bucket_threshold", value: "0.55 – 0.80", mono: true },
];

export const impactFields: DataField[] = [
  { label: "collateral_factor_before", value: "0.80", mono: true },
  { label: "collateral_factor_after", value: "0.72", mono: true },
  { label: "borrow_spread_bps", value: "+45", mono: true },
  { label: "new_borrow_allowed", value: "true", mono: true },
  { label: "consumer_tx", value: "— (mock state update)", mono: true },
];

export const guaranteeItems = [
  {
    title: "Proof correctness",
    body: "The published score is the exact output of the declared quantized ONNX graph (EZKL) or LoRA subgraph (Circom) for the committed public inputs.",
  },
  {
    title: "Oracle gate",
    body: "Oracle contract accepts only submissions whose proof verifies against the expected verifier address and public input set.",
  },
  {
    title: "Consumer gate",
    body: "Mock lending consumer updates borrower parameters only from verified oracle outputs in the same epoch.",
  },
];

export const nonGuaranteeItems = [
  {
    title: "Economic optimality",
    body: "The risk model is a research artifact; scores are not attested as profit-maximizing or manipulation-proof at the market level.",
  },
  {
    title: "Data honesty",
    body: "Feature inputs are assumed honestly computed off-chain. Zyocra proves inference, not oracle deviation of raw market data.",
  },
  {
    title: "Instant liquidation",
    body: "Consumer actions adjust collateral parameters and spreads—no model-triggered liquidation in scope.",
  },
];

export const assumptionItems = [
  "Trusted setup artifacts for the chosen proof system are generated and stored reproducibly.",
  "Quantization profile matches between ml-base export and circuit arithmetic.",
  "Verifier contract bytecode matches the compiled artifact committed in the repo.",
];

export const flowSteps = [
  { step: "01", label: "Epoch", path: "/epoch" },
  { step: "02", label: "Inputs", path: "/inputs" },
  { step: "03", label: "Prove", path: "/prove" },
  { step: "04", label: "Verify", path: "/verify" },
  { step: "05", label: "Score", path: "/score" },
  { step: "06", label: "Impact", path: "/impact" },
];
