import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
import { bucketThresholds } from "../data/content";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { FlowNav } from "../components/product/FlowNav";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatTile } from "../components/ui/StatTile";
import { scoreOutput } from "../data/product-placeholders";
import "./pages.css";

const screen = screenBySlug("score")!;

export function RiskScorePage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow={screen.eyebrow}
            title={screen.headline}
            body={screen.lede}
            actions={
              <ClippedButton to="/impact" variant="accent" size="lg">
                Protocol impact
              </ClippedButton>
            }
            aside={<p className="mono-label">risk bucket · MEDIUM</p>}
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <div className="panel-stack">
            <ClippedCard>
              <div id="score">
                <SectionHeader
                  label="Score"
                  title="Verified output · epoch-2026-041"
                  description="Oracle-emitted score after verifier admission. Float reference from ml-base on identical features."
                />
                <DataFieldGrid fields={scoreOutput} columns={3} />
              </div>
              <FlowNav />
            </ClippedCard>

            <ClippedCard>
              <div id="bucket">
                <SectionHeader
                  label="Risk bucket"
                  title="Consumer threshold map"
                  description="Discrete bands drive collateral factor and spread—documented in MockLendingConsumer, not inferred at runtime."
                />
                <div className="layer-list">
                  {bucketThresholds.map((row) => (
                    <article key={row.label} className="layer-list__item">
                      <span className="layer-list__num">{row.label}</span>
                      <h3 className="layer-list__title">{row.range}</h3>
                      <p className="layer-list__body">{row.action}</p>
                    </article>
                  ))}
                </div>
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="accuracy">
                <SectionHeader
                  label="Quant drift"
                  title="Float vs fixed-point"
                  description="Score error is reported alongside circuit size—precision and cost are coupled in zkML."
                />
                <div className="stats-grid">
                  <StatTile label="Float reference" value="0.739" detail="ml-base PyTorch eval" />
                  <StatTile label="Fixed Q8.8" value="0.742" detail="Verified circuit output" accent />
                  <StatTile label="Absolute error" value="0.003" detail="Within export tolerance" />
                </div>
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
