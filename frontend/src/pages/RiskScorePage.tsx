import { Shell } from "../components/layout/Shell";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { FlowNav } from "../components/product/FlowNav";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatTile } from "../components/ui/StatTile";
import { scoreOutput } from "../data/product-placeholders";
import "./pages.css";

const bucketThresholds = [
  { label: "LOW", range: "0.00 – 0.55", action: "Standard collateral factor" },
  { label: "MEDIUM", range: "0.55 – 0.80", action: "Reduced CF + borrow spread" },
  { label: "HIGH", range: "0.80 – 0.92", action: "Freeze new borrows" },
  { label: "CRITICAL", range: "> 0.92", action: "Delayed mitigation flag" },
];

export function RiskScorePage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow="Oracle output"
            title="Verified liquidation-risk score."
            body="Fixed-point score and risk bucket after successful on-chain verification."
            actions={
              <ClippedButton to="/impact" variant="accent" size="lg">
                See protocol impact
              </ClippedButton>
            }
            aside={<p className="mono-label">bucket: MEDIUM</p>}
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <div className="panel-stack">
            <ClippedCard>
              <div id="score">
                <SectionHeader
                  label="Score output"
                  title="epoch-2026-041 · borrower 0x9c4f…88a1"
                  description="Compared against float32 reference from ml-base evaluation harness."
                />
                <DataFieldGrid fields={scoreOutput} columns={3} />
              </div>
              <FlowNav />
            </ClippedCard>

            <ClippedCard>
              <div id="bucket">
                <SectionHeader
                  label="Risk bucket"
                  title="Consumer mapping thresholds"
                  description="Mock lending consumer maps buckets to collateral parameters—not liquidations."
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
                  label="Quantization drift"
                  title="Float vs fixed-point"
                  description="Error analysis axis for benchmark table and technical report."
                />
                <div className="stats-grid">
                  <StatTile label="Float ref" value="0.739" detail="PyTorch eval" />
                  <StatTile label="Fixed Q8.8" value="0.742" detail="Circuit arithmetic" accent />
                  <StatTile label="Abs error" value="0.003" detail="Within tolerance" />
                </div>
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
