export type DataField = {
  /** Display name */
  label: string;
  value: string;
  /** Short note under the value (units, source) */
  hint?: string;
  /** Native tooltip — e.g. full hash when value is abbreviated */
  title?: string;
  /** What this field means — shown under the label */
  description?: string;
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
  modelHash: "0x8f3c2a91e4b7d1069c8a3f2e1d0b5c4a91e8f3c",
  adapterHash: "0x2b17c04d8a6f3e9012bc445566778899aabbccddeeff",
  onnxCommit: "sha256:6c4e1f9a2b8d…b203c11",
  quantProfile: "Q8.8 · weight scale 256 · activation scale 128",
  verifierEzkl: "0x41A2c8E7C0f91D3e4B5a6C7d8E9f0A1b2C3d4E5",
  verifierCircom: "0x9D103F22a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6",
  blockHeight: "21_884_102",
  scoredAt: "2026-04-01T00:00:00Z",
  proofStatus: "generated",
  verifierStatus: "simulated_pass",
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

export const epochDetailFields: DataField[] = [
  {
    label: "Epoch ID",
    value: demoEpoch.id,
    mono: true,
    description: "Time-bounded scoring window. Binds model, adapter, and verifier set for all borrowers in the epoch.",
    hint: "ISO week 14 · 2026",
  },
  {
    label: "Proof status",
    value: "Generated",
    mono: true,
    description: "Off-chain prover state for the active borrower batch. Becomes Verified after EVM accept.",
    hint: "awaiting on-chain submit",
  },
  {
    label: "Verifier status",
    value: "Simulated pass",
    mono: true,
    description: "Result of Foundry dry-run against deployed RiskScoreVerifierV1.",
    hint: "Anvil · not broadcast",
  },
  {
    label: "Model hash",
    value: "0x8f3c…a91e",
    mono: true,
    hint: demoEpoch.modelHash,
    description: "Keccak256 of quantized ONNX graph bytes. Oracle rejects proofs for undeclared graphs.",
  },
  {
    label: "Adapter hash",
    value: "0x45f1…c002",
    mono: true,
    hint: demoEpoch.adapterHash,
    description: "Commitment to LoRA matrices A and B. Effective weights: W′ = W + AB.",
  },
  {
    label: "ONNX commit",
    value: demoEpoch.onnxCommit,
    mono: true,
    description: "Content-addressed export from ml-base/onnx-export for reproducible compile inputs.",
  },
  {
    label: "Quantization profile",
    value: demoEpoch.quantProfile,
    mono: true,
    description: "Fixed-point scales shared by ml-base, EZKL settings, and Circom field arithmetic.",
  },
  {
    label: "EZKL verifier",
    value: demoEpoch.verifierEzkl,
    mono: true,
    description: "Deployed address of compiler-generated Solidity verifier (baseline path).",
  },
  {
    label: "Circom verifier",
    value: demoEpoch.verifierCircom,
    mono: true,
    description: "Deployed address of hand-optimized LoRA subgraph verifier.",
  },
];

export const inputFeatures: DataField[] = [
  {
    label: "collateralization_ratio",
    value: "1.42",
    description: "Collateral value divided by outstanding debt.",
    hint: "ETH/USDC position · 6dp fixed",
  },
  {
    label: "debt_utilization",
    value: "0.68",
    description: "Borrowed amount as a fraction of protocol borrow limit.",
    hint: "normalized 0–1",
  },
  {
    label: "volatility_proxy_7d",
    value: "0.31",
    description: "Seven-day realized volatility proxy for collateral asset.",
    hint: "annualized σ",
  },
  {
    label: "liquidation_proximity",
    value: "0.12",
    description: "Distance to protocol liquidation threshold (0 = at risk, 1 = safe).",
    hint: "inverted distance",
  },
  {
    label: "borrow_concentration",
    value: "0.44",
    description: "Herfindahl-style concentration of borrows across markets.",
    hint: "wallet-level",
  },
  {
    label: "wallet_age_days",
    value: "412",
    description: "Days since first on-chain activity used as behavior prior.",
    hint: "deterministic feature pipeline",
  },
];

export const quantizationFields: DataField[] = [
  {
    label: "weight_scale",
    value: "256",
    mono: true,
    description: "Fixed-point divisor for weight tensors in circuit arithmetic.",
  },
  {
    label: "activation_scale",
    value: "128",
    mono: true,
    description: "Scale for intermediate activations—overflow bounds checked in export.",
  },
  {
    label: "accumulator_bits",
    value: "32",
    mono: true,
    description: "Bit width for dot-product accumulators before re-quantization.",
  },
  {
    label: "lora_rank",
    value: "8",
    mono: true,
    description: "Rank r in low-rank adapter matrices A ∈ ℝᵈˣʳ, B ∈ ℝʳˣᵏ.",
  },
  {
    label: "effective_weights",
    value: "W′ = W + AB",
    mono: true,
    description: "Statement proven by both paths: inference uses adapted weights, not base W alone.",
  },
];

export const publicInputFields: DataField[] = [
  {
    label: "borrower_id",
    value: "0x9c4f2e88a1b3c5d7e9f0112233445566778899aabb",
    mono: true,
    description: "Account whose feature vector is scored in this proof batch.",
  },
  {
    label: "Epoch ID",
    value: demoEpoch.id,
    mono: true,
    description: "Must match oracle epoch registry entry at submission time.",
  },
  {
    label: "Model hash",
    value: demoEpoch.modelHash,
    mono: true,
    description: "Public commitment wired into verifier public inputs.",
  },
  {
    label: "Adapter hash",
    value: demoEpoch.adapterHash,
    mono: true,
    description: "Public commitment to LoRA adapter weights for this epoch.",
  },
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

export const ezklArtifactFields: DataField[] = [
  {
    label: "Constraint count",
    value: proveRun.constraints,
    mono: true,
    description: "Total R1CS constraints after EZKL compilation of full ONNX graph.",
  },
  {
    label: "Peak RAM",
    value: proveRun.peakRam,
    mono: true,
    description: "High-water resident memory during proof generation (prover process).",
    hint: "GB · single-threaded CPU",
  },
  {
    label: "Proof time",
    value: proveRun.proofTime,
    mono: true,
    description: "Wall-clock time from witness generation through proof write.",
    hint: "seconds",
  },
  {
    label: "Proof size",
    value: proveRun.proofSize,
    mono: true,
    description: "Serialized proof byte length submitted to verifier calldata.",
    hint: "bytes",
  },
  {
    label: "Artifact path",
    value: proveRun.artifactPath,
    mono: true,
    description: "Committed proof JSON under circuits-baseline for reproducibility.",
  },
];

export const circomArtifactFields: DataField[] = [
  {
    label: "Constraint count",
    value: circomRun.constraints,
    mono: true,
    description: "Hand-counted constraints for LoRA delta + inference subgraph.",
  },
  {
    label: "Peak RAM",
    value: circomRun.peakRam,
    mono: true,
    description: "Peak memory during circom witness + snarkjs prove.",
    hint: "GB",
  },
  {
    label: "Proof time",
    value: circomRun.proofTime,
    mono: true,
    description: "End-to-end prove for same public inputs as EZKL path.",
    hint: "seconds",
  },
  {
    label: "Proof size",
    value: circomRun.proofSize,
    mono: true,
    description: "Groth16 proof size for custom verifier deployment.",
    hint: "bytes",
  },
  {
    label: "Artifact path",
    value: circomRun.artifactPath,
    mono: true,
    description: "Proof artifact under circuits-custom mirroring baseline layout.",
  },
];

export const verifyFields: DataField[] = [
  {
    label: "Verifier contract",
    value: "RiskScoreVerifierV1",
    mono: true,
    description: "Solidity verifier generated from active proving path artifact.",
  },
  {
    label: "Verifier status",
    value: "Simulated pass",
    mono: true,
    description: "Outcome of eth_call to verify(proof, publicInputs) before oracle submit.",
    hint: "Foundry dry-run",
  },
  {
    label: "Chain ID",
    value: "31337",
    mono: true,
    description: "Local Anvil chain for gas measurement and consumer integration tests.",
    hint: "Anvil default",
  },
  {
    label: "Gas used",
    value: "—",
    mono: true,
    description: "Gas consumed by verify()—primary on-chain cost axis in benchmarks.",
    hint: "from gas_report",
  },
  {
    label: "Proof hash",
    value: "0x1e90a4c4af8b2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7",
    mono: true,
    description: "Keccak256 of serialized proof bytes logged at submission.",
  },
  {
    label: "Submission status",
    value: "Not submitted",
    mono: true,
    description: "Oracle submitScore() not broadcast in demo shell.",
  },
];

export const scoreOutput: DataField[] = [
  {
    label: "Risk score (Q8.8)",
    value: "0.742",
    description: "Fixed-point liquidation-risk score emitted by verified inference.",
    hint: "circuit output",
  },
  {
    label: "Float reference",
    value: "0.739",
    description: "PyTorch float32 eval on same feature vector from ml-base.",
    hint: "ml-base/eval",
  },
  {
    label: "Absolute error",
    value: "0.003",
    description: "Quantization drift on score—benchmark axis alongside constraint count.",
    hint: "|float − fixed|",
  },
  {
    label: "Risk bucket",
    value: "MEDIUM",
    mono: true,
    description: "Discrete policy band derived from score thresholds in consumer contract.",
  },
  {
    label: "Bucket band",
    value: "0.55 – 0.80",
    mono: true,
    description: "Inclusive lower, exclusive upper bound for MEDIUM classification.",
  },
];

export const impactFields: DataField[] = [
  {
    label: "Collateral factor (before)",
    value: "0.80",
    mono: true,
    description: "Maximum borrow power per unit collateral before epoch update.",
  },
  {
    label: "Collateral factor (after)",
    value: "0.72",
    mono: true,
    description: "Post-verification factor applied by RiskConsumer for MEDIUM bucket.",
  },
  {
    label: "Borrow spread",
    value: "+45 bps",
    mono: true,
    description: "Additional borrow rate premium while bucket remains MEDIUM.",
  },
  {
    label: "New borrow allowed",
    value: "true",
    mono: true,
    description: "HIGH bucket would set false—no model-triggered liquidation in scope.",
  },
  {
    label: "Consumer tx",
    value: "Pending simulation",
    mono: true,
    description: "setCollateralParams() call after oracle ScoreVerified event.",
  },
];

export const auditTrail: DataField[] = [
  {
    label: "Oracle submission",
    value: "epoch-2026-041 · queued",
    mono: true,
    description: "RiskOracle.submitScore with proof bytes and public input array.",
  },
  {
    label: "Verified at block",
    value: "—",
    mono: true,
    description: "Block number when verifier returned true on-chain.",
  },
  {
    label: "Consumer update",
    value: "applyVerifiedScore()",
    mono: true,
    description: "Mock lending consumer applies bucket policy to borrower state.",
  },
  {
    label: "Previous bucket",
    value: "LOW",
    mono: true,
    description: "Risk classification before this epoch score.",
  },
  {
    label: "New bucket",
    value: "MEDIUM",
    mono: true,
    description: "Classification driving collateral factor and spread delta.",
  },
];

export const guaranteeItems = [
  {
    title: "Inference integrity",
    body: "The published score equals the output of the declared quantized graph (EZKL) or LoRA subgraph (Circom) for the committed public inputs—no undisclosed weights or adapters.",
  },
  {
    title: "Oracle admission",
    body: "RiskOracle accepts only proofs that verify against the deployed verifier contract and match epoch model and adapter hashes.",
  },
  {
    title: "Consumer coupling",
    body: "RiskConsumer mutates borrower collateral policy only after a verified oracle emission in the same epoch.",
  },
];

export const nonGuaranteeItems = [
  {
    title: "Model alpha",
    body: "Zyocra does not claim the risk model maximizes PnL or predicts black-swan events—only that inference was executed as committed.",
  },
  {
    title: "Input provenance",
    body: "Feature vectors are assumed correctly computed off-chain. Proof covers inference, not manipulation of price feeds or indexers.",
  },
  {
    title: "Liquidation execution",
    body: "Policy updates adjust collateral factor and spreads. Instant liquidation bots are explicitly out of scope.",
  },
];

export const assumptionItems = [
  "Proving keys and verifier bytecode match the pinned toolchain versions (EZKL 23.0.5, circom 2.2.x) used in CI and local demos.",
  "Quantization scales in ml-base match EZKL settings.json and Circom witness grids (Q8.8: activation_scale=128, weight_scale=256).",
  "Model and adapter hashes registered at oracle deploy time match the artifacts used by the off-chain prover.",
  "Oracle owner acts honestly when rotating verifiers, or governance constraints are added before production.",
];

export const flowSteps = [
  { step: "01", label: "Epoch", path: "/epoch" },
  { step: "02", label: "Inputs", path: "/inputs" },
  { step: "03", label: "Prove", path: "/prove" },
  { step: "04", label: "Verify", path: "/verify" },
  { step: "05", label: "Score", path: "/score" },
  { step: "06", label: "Impact", path: "/impact" },
];
