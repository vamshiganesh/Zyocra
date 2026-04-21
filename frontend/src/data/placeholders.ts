import type { BenchmarkRow } from "../components/ui/BenchmarkPanel";
import type { FaqItem } from "../components/ui/FaqAccordion";
import type { PricingPlan } from "../components/ui/PricingTable";

export const benchmarkRows: BenchmarkRow[] = [
  { metric: "Constraint count", ezkl: "—", circom: "—" },
  { metric: "Prover peak RAM", ezkl: "—", circom: "—" },
  { metric: "Proof generation time", ezkl: "—", circom: "—" },
  { metric: "Verification gas", ezkl: "—", circom: "—" },
  { metric: "Proof size", ezkl: "—", circom: "—" },
  { metric: "Float vs fixed-point error", ezkl: "—", circom: "—" },
];

export const faqItems: FaqItem[] = [
  {
    question: "What does Zyocra prove?",
    answer:
      "That a published liquidation-risk score was computed from a declared quantized model and LoRA-adapted weights (W′ = W + AB), under the chosen proof system.",
  },
  {
    question: "Why two proving paths?",
    answer:
      "The EZKL baseline shows a full compiler pipeline from ONNX to an EVM verifier. The Circom path hand-optimizes the LoRA subgraph so we can measure whether structured low-rank algebra is cheaper than generic compiler output.",
  },
  {
    question: "Does the consumer liquidate positions?",
    answer:
      "No. The mock lending consumer updates collateral parameters by risk bucket—standard, tightened, freeze new borrows, or delayed mitigation—not instant liquidation.",
  },
  {
    question: "Is this local-first?",
    answer:
      "Yes. Default workflows run on Ubuntu WSL with free tools: PyTorch CPU, ONNX, EZKL, Circom, Foundry, and Anvil. No paid RPCs or hosted provers are required.",
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    name: "Research",
    price: "Free",
    description: "Reproduce benchmarks and run local prove/verify demos.",
    cta: "Clone repo",
    features: [
      { label: "Local EZKL path", included: true },
      { label: "Circom gadgets", included: true },
      { label: "Mock consumer", included: true },
      { label: "Support", included: "Docs only" },
    ],
  },
  {
    name: "Lab",
    price: "—",
    period: "placeholder",
    description: "Reserved for future hosted verifier experiments.",
    cta: "Join waitlist",
    featured: true,
    features: [
      { label: "Local EZKL path", included: true },
      { label: "Circom gadgets", included: true },
      { label: "Gas snapshots", included: true },
      { label: "Support", included: "Community" },
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Not offered yet — shell only for layout parity.",
    cta: "Talk later",
    features: [
      { label: "Custom circuits", included: false },
      { label: "Dedicated review", included: false },
      { label: "SLA", included: false },
      { label: "Support", included: "—" },
    ],
  },
];

export const blogPosts = [
  {
    title: "Why LoRA structure matters for zkML circuits",
    category: "Engineering",
    date: "Apr 8, 2026",
    variant: "pyramid" as const,
  },
  {
    title: "Fixed-point quantization as a first-class benchmark axis",
    category: "Research",
    date: "Mar 15, 2026",
    variant: "rings" as const,
  },
  {
    title: "Risk buckets, not liquidations: designing the consumer",
    category: "Product",
    date: "Feb 28, 2026",
    variant: "hex" as const,
  },
];

export const changelog = [
  {
    version: "0.1.0",
    date: "Jul 4, 2026",
    items: [
      { tag: "NEW", text: "Screen architecture: 10 product routes from overview through changelog." },
      { tag: "NEW", text: "Pipeline flow navigation (epoch → inputs → prove → verify → score → impact)." },
      { tag: "NEW", text: "UI shell and design system (Dispatch-inspired, yellow accent)." },
      { tag: "NEW", text: "Monorepo layout for ml-base, circuits, contracts, benchmarks." },
      { tag: "NOTE", text: "Prove/verify pipelines not connected to the UI yet." },
    ],
  },
];
