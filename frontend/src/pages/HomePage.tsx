import { BenchmarkPanel } from "../components/ui/BenchmarkPanel";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { FaqAccordion } from "../components/ui/FaqAccordion";
import { GeoFrame } from "../components/ui/GeoFrame";
import { PricingTable } from "../components/ui/PricingTable";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatTile } from "../components/ui/StatTile";
import { Shell } from "../components/layout/Shell";
import {
  benchmarkRows,
  faqItems,
  pricingPlans,
} from "../data/placeholders";
import "./pages.css";

const layers = [
  {
    num: "01",
    title: "Connect features",
    body: "Deterministic tabular inputs: collateralization, utilization, volatility proxies, and wallet summaries.",
  },
  {
    num: "02",
    title: "Adapt with LoRA",
    body: "Apply low-rank adapters as W′ = W + AB before quantized inference.",
  },
  {
    num: "03",
    title: "Prove the score",
    body: "EZKL baseline on the full ONNX graph, or Circom on the LoRA subgraph.",
  },
  {
    num: "04",
    title: "Update risk buckets",
    body: "Verified scores adjust collateral parameters in a mock lending consumer.",
  },
];

const features = [
  {
    title: "Context assembly",
    index: "001",
    body: "Unify borrower features into a structured operational vector for epoch scoring.",
    variant: "rings" as const,
  },
  {
    title: "Policy & proofs",
    index: "002",
    body: "Publish only scores accompanied by a valid proof against the declared model and adapters.",
    variant: "hex" as const,
  },
  {
    title: "Action execution",
    index: "003",
    body: "Map verified risk buckets to collateral factors, spreads, and borrow freezes—not liquidations.",
    variant: "pyramid" as const,
  },
];

export function HomePage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <div className="hero">
            <div>
              <p className="hero__eyebrow mono-label label-dot">
                Ready to ship verifiable risk
              </p>
              <h1 className="hero__title">Prove risk scores. Update collateral.</h1>
              <p className="hero__body">
                Zyocra is a local-first zkML oracle for LoRA-adapted liquidation-risk
                inference—benchmarking EZKL-generated circuits against hand-optimized
                Circom, with on-chain verification in a mock lending protocol.
              </p>
              <div className="hero__actions" id="get-started">
                <ClippedButton to="/updates" variant="surface" size="lg">
                  View updates
                </ClippedButton>
                <ClippedButton to="/about" variant="ghost" size="lg">
                  About the project
                </ClippedButton>
              </div>
            </div>
            <div className="hero__aside hatch-dark">
              <svg className="hero__aside-svg" viewBox="0 0 240 160" fill="none" aria-hidden="true">
                <path d="M10 130C50 40 90 40 130 130C170 220 210 40 230 80" stroke="currentColor" strokeWidth="1" />
                <path d="M10 100C50 10 90 10 130 100C170 190 210 10 230 50" stroke="currentColor" strokeWidth="1" />
                <path d="M10 70C50 -20 90 -20 130 70C170 160 210 -20 230 20" stroke="currentColor" strokeWidth="1" />
              </svg>
            </div>
          </div>
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
      <div className="panel-stack">
        <ClippedCard>
          <div id="capabilities">
            <SectionHeader
              label="Capabilities"
              title="Four layers that connect, adapt, prove, and act."
              description="A compact tabular risk model with LoRA adapters, dual proving paths, and a consumer that only trusts verified scores."
            />
            <div className="layer-list">
              {layers.map((layer) => (
                <article key={layer.num} className="layer-list__item">
                  <span className="layer-list__num">{layer.num}</span>
                  <h3 className="layer-list__title">{layer.title}</h3>
                  <p className="layer-list__body">{layer.body}</p>
                </article>
              ))}
            </div>
          </div>
        </ClippedCard>

        <ClippedCard>
          <div id="numbers">
            <SectionHeader
              label="Numbers"
              title="The performance behind the proofs"
              description="Placeholder tiles for epoch throughput, coverage, and accuracy—wired to real benchmarks later."
            />
            <div className="stats-grid">
              <StatTile
                label="Weekly scores"
                value="1,231"
                detail="Epoch risk evaluations (placeholder)"
              />
              <StatTile
                label="Resolution growth"
                value="+65.5%"
                detail="Gated by approvals (placeholder)"
                accent
              />
              <StatTile
                label="Ops throughput"
                value="139%"
                detail="Relative agent capacity (placeholder)"
              />
              <StatTile
                label="Agent mode"
                value="72%"
                detail="Automated path share (placeholder)"
              />
              <StatTile
                label="Coverage growth"
                value="+247%"
                detail="Processes automated (placeholder)"
                accent
              />
              <StatTile
                label="Automation coverage"
                value="69%"
                detail="With policies + proofs (placeholder)"
              />
            </div>
          </div>
        </ClippedCard>

        <ClippedCard>
          <div id="features">
            <SectionHeader
              label="Features"
              title="Core systems that power every epoch"
              description="Context, policy, and action surfaces for a verifiable risk oracle—not a trading bot."
            />
            <div className="feature-grid">
              {features.map((feature) => (
                <article key={feature.index} className="feature-card">
                  <div className="feature-card__meta">
                    <h3 className="feature-card__title">{feature.title}</h3>
                    <span className="feature-card__index">{feature.index}</span>
                  </div>
                  <GeoFrame variant={feature.variant} />
                  <p className="feature-card__body">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </ClippedCard>

        <ClippedCard>
          <div id="benchmarks">
            <SectionHeader
              label="Benchmarks"
              title="Compiler path vs hand-optimized LoRA circuit"
              description="Apples-to-apples metrics are the primary research artifact. Values fill in at Milestone 5."
            />
            <div style={{ marginTop: "var(--space-8)" }}>
              <BenchmarkPanel rows={benchmarkRows} />
            </div>
          </div>
        </ClippedCard>

        <ClippedCard>
          <div id="pricing">
            <SectionHeader
              label="Pricing"
              title="Simple plans that scale with research"
              description="Shell only—Zyocra is open research infrastructure first. Plans illustrate layout parity."
            />
            <div style={{ marginTop: "var(--space-8)" }}>
              <PricingTable plans={pricingPlans} />
            </div>
          </div>
        </ClippedCard>

        <ClippedCard>
          <div id="faq">
            <SectionHeader
              label="FAQ"
              title="Frequently asked questions"
              description="What is proven, what is not, and how the consumer behaves."
            />
            <div style={{ marginTop: "var(--space-6)" }}>
              <FaqAccordion items={faqItems} />
            </div>
          </div>
        </ClippedCard>
      </div>
        </Shell>
      </section>
    </div>
  );
}
