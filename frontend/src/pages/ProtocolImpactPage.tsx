import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { DataStatus } from "../components/product/DataStatus";
import { FlowNav } from "../components/product/FlowNav";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatTile } from "../components/ui/StatTile";
import { usePipelineFields } from "../data/use-pipeline-fields";
import "./pages.css";

const screen = screenBySlug("impact")!;

export function ProtocolImpactPage() {
  const {
    status,
    error,
    reload,
    live,
    impactFields,
    auditTrail,
    scoreBucket,
    borrowerShort,
    collateralBps,
    spreadBps,
    borrowAllowed,
    onChain,
  } = usePipelineFields();

  const collateral = collateralBps !== undefined ? (collateralBps / 10_000).toFixed(2) : "0.72";
  const spreadLabel = spreadBps !== undefined && spreadBps > 0 ? `+${spreadBps} bps` : "0 bps";
  const borrowLabel = borrowAllowed === false ? "Frozen" : "Allowed";

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
            aside={<p className="mono-label">RiskConsumer · {onChain ? "applied" : "preview"}</p>}
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <DataStatus status={status} error={error} onRetry={reload} />
          <div className="panel-stack">
            <ClippedCard>
              <div id="consumer">
                <SectionHeader
                  label="Consumer"
                  title={`Borrower ${borrowerShort}`}
                  description={`Collateral factor is the primary lever—${scoreBucket} bucket sets borrow power and spread.`}
                />
                <DataFieldGrid fields={impactFields} columns={2} />
              </div>
              <FlowNav />
            </ClippedCard>

            <ClippedCard>
              <div id="params">
                <SectionHeader
                  label="Deltas"
                  title={`${scoreBucket} bucket application`}
                  description={
                    live
                      ? "Policy output from RiskConsumer after verified score admission."
                      : "Placeholder deltas from static demo — sync artifacts for live values."
                  }
                />
                <div className="stats-grid">
                  <StatTile
                    label="Collateral factor"
                    value={collateral}
                    detail={collateralBps !== undefined ? `${collateralBps} bps` : "—"}
                    accent
                  />
                  <StatTile label="Borrow spread" value={spreadLabel} detail="Applied on next borrow" />
                  <StatTile label="New borrow" value={borrowLabel} detail="Frozen at HIGH bucket" />
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
