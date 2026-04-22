import type { BenchmarkRow } from "../components/ui/BenchmarkPanel";
import type { FaqItem } from "../components/ui/FaqAccordion";

export const benchmarkRows: BenchmarkRow[] = [
  { metric: "Constraint count", ezkl: "—", circom: "—" },
  { metric: "Peak RAM (prover)", ezkl: "—", circom: "—" },
  { metric: "Proof generation time", ezkl: "—", circom: "—" },
  { metric: "Verification gas", ezkl: "—", circom: "—" },
  { metric: "Proof size (bytes)", ezkl: "—", circom: "—" },
  { metric: "Score quant error", ezkl: "—", circom: "—" },
];

export const faqItems: FaqItem[] = [
  {
    question: "What statement does Zyocra prove?",
    answer:
      "That a published liquidation-risk score is the exact output of a declared quantized model with LoRA-adapted weights (W′ = W + AB), for specific public inputs, under either the EZKL-compiled ONNX graph or the Circom LoRA subgraph.",
  },
  {
    question: "Why benchmark EZKL against Circom?",
    answer:
      "Compiler-generated zkML hides arithmetic structure. A hand-optimized low-rank circuit tests whether LoRA's algebra is cheaper to prove than a generic ONNX compile—constraint count, RAM, proof time, gas, and proof size are measured on identical inputs.",
  },
  {
    question: "What is an epoch?",
    answer:
      "A bounded scoring window with committed model hash, adapter hash, quantization profile, and verifier addresses. All borrower scores in that window reference the same commitments so proofs are comparable and reproducible.",
  },
  {
    question: "What does the consumer contract do?",
    answer:
      "MockLendingConsumer maps verified risk buckets to collateral factor, borrow spread, and borrow-freeze flags. It does not liquidate—policy tightening only, aligned with how risk oracles are used in production lending design.",
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
      "The benchmark comparison table, threat model guarantees vs non-guarantees, and contract tests for verifier accept/reject and consumer parameter updates after verified oracle submissions.",
  },
];

export const changelog = [
  {
    version: "0.2.0",
    date: "Jul 4, 2026",
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
    date: "Jul 4, 2026",
    title: "Monorepo foundation",
    description: "Repository layout, design system, and local toolchain—no live prover wiring.",
    items: [
      { tag: "REPO", text: "ml-base, circuits-baseline, circuits-custom, contracts, benchmarks layout." },
      { tag: "UI", text: "Dispatch-inspired design system; yellow accent; clipped geometry components." },
      { tag: "ORACLE", text: "RiskOracle.sol scaffold—commitment storage, proof gate stub (Milestone 2)." },
      { tag: "EZKL", text: "circuits-baseline/ directory and settings placeholder for ONNX compile path." },
      { tag: "CIRCOM", text: "circuits-custom/ LoRA gadget stubs for benchmark path (Milestone 3)." },
      { tag: "CONSUMER", text: "MockLendingConsumer risk-bucket mapping spec in contracts/ (Milestone 4)." },
      { tag: "NOTE", text: "Prove, verify, and benchmark values in UI are illustrative until milestones ship." },
    ],
  },
];
