import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
import { bucketThresholds } from "../data/content";
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

const screen = screenBySlug("score")!;

export function RiskScorePage() {
  const { status, error, reload, live, epochId, scoreOutput, scoreFloat, scoreBucket } =
    usePipelineFields();

  const floatRef = scoreFloat !== undefined ? scoreFloat.toFixed(4) : "0.739";
  const fixedOut = scoreOutput.find((f) => f.label === "Risk score")?.value ?? "0.742";
  const absErr =
    scoreFloat !== undefined
      ? Math.abs(scoreFloat - parseFloat(fixedOut)).toFixed(4)
      : "0.003";

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
            aside={<p className="mono-label">risk bucket · {scoreBucket}</p>}
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <DataStatus status={status} error={error} onRetry={reload} />
          <div className="panel-stack">
            <ClippedCard>
              <div id="score">
                <SectionHeader
                  label="Score"
                  title={`Verified output · ${epochId}`}
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
                  description="Discrete bands drive collateral factor and spread—documented in RiskConsumer, not inferred at runtime."
                />
                <div className="layer-list">
                  {bucketThresholds.map((row) => (
                    <article
                      key={row.label}
                      className={`layer-list__item${row.label === scoreBucket ? " layer-list__item--active" : ""}`}
                    >
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
                  <StatTile label="Float reference" value={floatRef} detail="ml-base / witness rescaled" />
                  <StatTile label="Circuit output" value={fixedOut} detail="Verified score field" accent />
                  <StatTile
                    label="Absolute error"
                    value={absErr}
                    detail={live ? "From synced demo artifacts" : "Within export tolerance"}
                  />
                </div>
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
