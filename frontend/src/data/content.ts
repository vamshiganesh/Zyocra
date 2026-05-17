export type HeroLayer = {
  id: string;
  index: string;
  title: string;
  bullets: string[];
};

export const overviewCopy = {
  hero: {
    eyebrow: "Verifiable risk oracle",
    title: "Prove inference.\nPublish score.\nAdjust collateral.",
    body: "Zyocra attests that a quantized LoRA-adapted risk model executed correctly off-chain, verifies the result on EVM, and benchmarks EZKL against a hand-optimized Circom path.",
    ctaPrimary: "Walk pipeline",
    ctaSecondary: "Benchmark comparison",
    layers: [
      {
        id: "commit",
        index: "01",
        title: "Commit layer",
        bullets: [
          "Register model and adapter hashes on RiskOracle.",
          "Seal ONNX export and quantization profile per epoch.",
          "Reject proofs generated under undeclared weights.",
        ],
      },
      {
        id: "prove",
        index: "02",
        title: "Prove layer",
        bullets: [
          "Run EZKL on the full risk MLP ONNX graph.",
          "Emit witness, proof bytes, and public input instances.",
          "Compare against Circom head subgraph in benchmarks.",
        ],
      },
      {
        id: "verify",
        index: "03",
        title: "Verify layer",
        bullets: [
          "Check proof via Halo2Verifier on local Anvil or testnet.",
          "Bind scoreBps to publicInputs[6] after verification.",
          "Gate oracle admission before consumer policy runs.",
        ],
      },
      {
        id: "apply",
        index: "04",
        title: "Apply layer",
        bullets: [
          "Map verified score to LOW / MEDIUM / HIGH / CRITICAL bucket.",
          "Update collateral factor and borrow spread on-chain.",
          "Emit audit trail without model-triggered liquidation.",
        ],
      },
    ] satisfies HeroLayer[],
  },