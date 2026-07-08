import type { BenchmarkRow } from "../components/ui/BenchmarkPanel";
import type { FaqItem } from "../components/ui/FaqAccordion";

export const benchmarkRows: BenchmarkRow[] = [
  { metric: "Constraint count", ezkl: "N/A", circom: "N/A" },
  { metric: "Peak RAM (prover)", ezkl: "N/A", circom: "N/A" },
  { metric: "Proof generation time", ezkl: "N/A", circom: "N/A" },
  { metric: "Verification gas", ezkl: "N/A", circom: "N/A" },
  { metric: "Proof size (bytes)", ezkl: "N/A", circom: "N/A" },
  { metric: "Score quant error", ezkl: "N/A", circom: "N/A" },
];

export const faqItems: FaqItem[] = [
  {
    question: "What statement does Zyocra prove?",
    answer:
      "That a published liquidation-risk score is the exact output of a declared quantized model with LoRA-adapted weights (W′ = W + AB), for specific public inputs. EZKL can attest the full ONNX graph; Circom attests the LoRA output-head subgraph (hidden → logit_acc).",
  },
  {
    question: "Why benchmark EZKL against Circom?",
    answer:
      "LoRA updates live on the head. The fair circuit comparison is EZKL head-only vs hand Circom on the same hidden→logit statement. Full-graph EZKL is a different system workload (complete score attestation), not a matched race against Circom head.",
  },
  {
    question: "Isn’t full EZKL vs Circom head unfair?",
    answer:
      "Yes if you treat that table as a kernel bakeoff. We lead with matched head metrics and label full-vs-head as asymmetric system workloads. Hybrid amortization models rare full proves plus frequent head updates.",
  },
  {
    question: "What is an epoch?",
    answer:
      "A bounded scoring window with committed model hash, adapter hash, quantization profile, and verifier addresses. All borrower scores in that window reference the same commitments so proofs are comparable and reproducible.",
  },
  {
    question: "What does the consumer contract do?",
    answer:
      "RiskConsumer maps verified risk buckets to collateral factor, borrow spread, and borrow-freeze flags. It does not liquidate; policy tightening only, aligned with how risk oracles are used in production lending design.",
  },
  {
    question: "What do model hash and adapter hash bind?",
    answer:
      "Model hash commits the quantized ONNX graph bytes. Adapter hash commits LoRA matrices A and B. The oracle rejects proofs generated under different weights than those registered for the epoch.",
  },
  {
    question: "Is this runnable without paid infrastructure?",
    answer:
      "Yes. Default path uses Ubuntu WSL, PyTorch CPU, EZKL, Circom, Foundry, and Anvil. Proofs and verification run locally; benchmarks write to benchmarks/raw-results/.",
  },
  {
    question: "What should a reviewer look at first?",
    answer:
      "Primary: matched EZKL head vs Circom head on Benchmarks. Then threat-model guarantees vs non-guarantees, and oracle/consumer tests. Treat full-graph vs Circom head as a labeled system contrast, not the fair race.",
  },
];

export const changelog = [
  {
    version: "0.3.0",
    date: "Jul 5, 2026",
    title: "End-to-end oracle demo and benchmarks",
    description: "EZKL prove→verify→oracle→consumer loop, Circom custom path, benchmark harness, live UI data binding.",
    items: [
      { tag: "EZKL", text: "circuits-baseline pipeline, Halo2Verifier, e2e_phase1.sh on Anvil." },
      { tag: "CIRCOM", text: "lora_output_head circuit, Groth16 oracle e2e via e2e_circom.sh." },
      { tag: "BENCH", text: "make benchmark: normalized JSON/CSV/MD + plots; EZKL vs Circom metrics." },
      { tag: "UI", text: "phase1-demo.json + bench-latest.json wired to pipeline and benchmark screens." },
      { tag: "DOCS", text: "threat-model.md, benchmarks.md, frontend-data.md." },
    ],
  },
  {
    version: "0.2.0",
    date: "May 4, 2026",
    title: "Product screens and messaging",
    description: "Ten-route oracle demo shell with pipeline navigation and zk/DeFi-specific copy.",
    items: [
      { tag: "UI", text: "Screen architecture: overview through changelog with epoch → impact pipeline." },
      { tag: "COPY", text: "Field labels and descriptions for model hash, adapter hash, proof status, gas, RAM, collateral factor." },
      { tag: "DOCS", text: "docs/screens.md and docs/messaging.md for route and voice reference." },
    ],
  },
  {
    version: "0.1.0",
    date: "Apr 15, 2026",
    title: "Monorepo foundation",
    description: "Repository layout, design system, and local toolchain with no live prover wiring.",
    items: [
      { tag: "REPO", text: "ml-base, circuits-baseline, circuits-custom, contracts, benchmarks layout." },
      { tag: "UI", text: "Dispatch-inspired design system; yellow accent; clipped geometry components." },
      { tag: "ORACLE", text: "RiskOracle.sol scaffold: commitment storage, proof gate stub (Milestone 2)." },
      { tag: "EZKL", text: "circuits-baseline/ directory and settings placeholder for ONNX compile path." },
      { tag: "CIRCOM", text: "circuits-custom/ LoRA gadget stubs for benchmark path (Milestone 3)." },
      { tag: "CONSUMER", text: "RiskConsumer risk-bucket mapping in contracts/ (Foundry tests)." },
      { tag: "NOTE", text: "Prove, verify, and benchmark values in UI are illustrative until milestones ship." },
    ],
  },
];
