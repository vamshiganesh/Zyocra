import { Shell } from "../components/layout/Shell";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { FlowNav } from "../components/product/FlowNav";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatTile } from "../components/ui/StatTile";
import { impactFields } from "../data/product-placeholders";
import "./pages.css";

const auditTrail = [
  { label: "oracle_submission", value: "epoch-2026-041 / tx pending", mono: true },
  { label: "verified_at_block", value: "—", mono: true },
  { label: "consumer_update", value: "setCollateralParams()", mono: true },
  { label: "previous_bucket", value: "LOW", mono: true },
  { label: "new_bucket", value: "MEDIUM", mono: true },
];

export function ProtocolImpactPage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow="Consumer contract"
            title="Collateral parameters after verification."
            body="Mock lending consumer applies verified risk buckets to collateral factor, spread, and borrow flags."
            actions={
              <>
                <ClippedButton to="/benchmarks" variant="accent" size="lg">
                  Compare benchmarks
                </ClippedButton>
                <ClippedButton to="/epoch" variant="ghost" size="lg">
                  New epoch
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
                  label="Consumer state"
                  title="Borrower 0x9c4f…88a1"
                  description="State after verified oracle output for epoch-2026-041. Values illustrative."
                />
                <DataFieldGrid fields={impactFields} columns={2} />
              </div>
              <FlowNav />
            </ClippedCard>

            <ClippedCard>
              <div id="params">
                <SectionHeader
                  label="Parameter delta"
                  title="MEDIUM bucket adjustments"
                  description="Collateral factor reduced from 0.80 → 0.72; borrow spread +45 bps."
                />
                <div className="stats-grid">
                  <StatTile label="Collateral factor Δ" value="−0.08" detail="0.80 → 0.72" accent />
                  <StatTile label="Borrow spread" value="+45 bps" detail="Applied on next borrow" />
                  <StatTile label="New borrow" value="Allowed" detail="HIGH would freeze" />
                </div>
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="audit">
                <SectionHeader
                  label="Audit trail"
                  title="On-chain event log (placeholder)"
                  description="Foundry test harness will emit ScoreVerified and ParamsUpdated events."
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
