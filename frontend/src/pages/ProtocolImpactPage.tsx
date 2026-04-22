import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { FlowNav } from "../components/product/FlowNav";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatTile } from "../components/ui/StatTile";
import { auditTrail, impactFields } from "../data/product-placeholders";
import "./pages.css";

const screen = screenBySlug("impact")!;

export function ProtocolImpactPage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow={screen.eyebrow}
            title={screen.headline}
            body={screen.lede}
            actions={
              <>
                <ClippedButton to="/benchmarks" variant="accent" size="lg">
                  Benchmark results
                </ClippedButton>
                <ClippedButton to="/epoch" variant="ghost" size="lg">
                  Next epoch
                </ClippedButton>
              </>
            }
            aside={<p className="mono-label">MockLendingConsumerV1</p>}
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <div className="panel-stack">
            <ClippedCard>
              <div id="consumer">
                <SectionHeader
                  label="Consumer"
                  title="Borrower 0x9c4f…88a1"
                  description="Collateral factor is the primary lever—MEDIUM bucket tightens borrow power without forcing liquidation."
                />
                <DataFieldGrid fields={impactFields} columns={2} />
              </div>
              <FlowNav />
            </ClippedCard>

            <ClippedCard>
              <div id="params">
                <SectionHeader
                  label="Deltas"
                  title="MEDIUM bucket application"
                  description="Δ collateral factor −0.08 and +45 bps spread from verified score 0.742."
                />
                <div className="stats-grid">
                  <StatTile label="Collateral factor Δ" value="−0.08" detail="0.80 → 0.72" accent />
                  <StatTile label="Borrow spread" value="+45 bps" detail="Applied on next borrow" />
                  <StatTile label="New borrow" value="Allowed" detail="Frozen at HIGH bucket" />
                </div>
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="audit">
                <SectionHeader
                  label="Audit trail"
                  title="On-chain event sequence"
                  description="Foundry tests assert ScoreVerified precedes setCollateralParams for the same borrower and epoch."
                />
                <DataFieldGrid fields={auditTrail} columns={2} />
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
