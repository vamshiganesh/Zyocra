import { Shell } from "../components/layout/Shell";
import { ProductHero } from "../components/product/ProductHero";
import { PipelineStrip } from "../components/product/PipelineStrip";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatTile } from "../components/ui/StatTile";
import { flowSteps } from "../data/product-placeholders";
import "./pages.css";

const systemLayers = [
  {
    num: "01",
    title: "ml-base",
    body: "Quantized tabular risk model, LoRA adapters, ONNX export, float vs fixed-point eval.",
  },
  {
    num: "02",
    title: "circuits-baseline",
    body: "EZKL compile → setup → proof → generated EVM verifier from ONNX graph.",
  },
  {
    num: "03",
    title: "circuits-custom",
    body: "Hand-optimized Circom for W′ = W + AB and selected inference subgraph.",
  },
  {
    num: "04",
    title: "contracts",
    body: "Oracle stores commitments and verified scores; consumer adjusts collateral parameters.",
  },
];

export function OverviewPage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow="Zyocra oracle"
            title="Prove risk scores. Update collateral."
            body="Local-first zkML oracle for LoRA-adapted liquidation-risk inference—dual proving paths, on-chain verification, and a mock lending consumer."
            actions={
              <>
                <ClippedButton to="/epoch" variant="accent" size="lg">
                  Open epoch explorer
                </ClippedButton>
                <ClippedButton to="/benchmarks" variant="ghost" size="lg">
                  View benchmarks
                </ClippedButton>
              </>
            }
            aside={
              <svg className="hero__aside-svg" viewBox="0 0 240 160" fill="none" aria-hidden="true">
                <path d="M10 130C50 40 90 40 130 130C170 220 210 40 230 80" stroke="currentColor" strokeWidth="1" />
                <path d="M10 100C50 10 90 10 130 100C170 190 210 10 230 50" stroke="currentColor" strokeWidth="1" />
                <path d="M10 70C50 -20 90 -20 130 70C170 160 210 -20 230 20" stroke="currentColor" strokeWidth="1" />
              </svg>
            }
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <div className="panel-stack">
            <ClippedCard>
              <div id="flow">
                <SectionHeader
                  label="Epoch flow"
                  title="Six screens from epoch selection to protocol impact"
                  description="Follow the pipeline in order or jump to any step. All values are placeholder until Milestone wiring."
                />
                <PipelineStrip />
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="system">
                <SectionHeader
                  label="System"
                  title="Monorepo layers"
                  description="Research-grade layout aligned with ml-base, dual circuit paths, and Foundry contracts."
                />
                <div className="layer-list">
                  {systemLayers.map((layer) => (
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
              <div id="metrics">
                <SectionHeader
                  label="Headline metrics"
                  title="Benchmark targets (Milestone 5)"
                  description="Primary evidence table compares EZKL baseline against Circom LoRA path."
                />
                <div className="stats-grid">
                  <StatTile label="Constraint count" value="—" detail="EZKL vs Circom" />
                  <StatTile label="Prover peak RAM" value="—" detail="Same machine spec" accent />
                  <StatTile label="Proof time" value="—" detail="End-to-end prover" />
                  <StatTile label="Verify gas" value="—" detail="Foundry snapshot" />
                  <StatTile label="Proof size" value="—" detail="Bytes on disk" accent />
                  <StatTile label="Quant error" value="—" detail="Float vs fixed-point" />
                </div>
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="entry">
                <SectionHeader
                  label="Start epoch"
                  title="Run the demo pipeline"
                  description="Begin at Model Epoch Explorer with epoch-2026-041 placeholder data."
                />
                <div className="hero__actions" style={{ marginTop: "var(--space-6)" }}>
                  <ClippedButton to={flowSteps[0].path} variant="accent" size="md">
                    Start at epoch
                  </ClippedButton>
                  <ClippedButton to="/threat-model" variant="surface" size="md">
                    Read threat model
                  </ClippedButton>
                </div>
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
