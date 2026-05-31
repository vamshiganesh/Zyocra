import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
import { BenchmarkPlaceholderPanel } from "../components/product/BenchmarkPlaceholderPanel";
import { DataStatus } from "../components/product/DataStatus";
import { benchmarkArtifacts, benchmarkMethodology } from "../data/content";
import { ProductHero } from "../components/product/ProductHero";
import { RunEpochDemoButton } from "../components/product/RunEpochDemoButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useBenchmarkData } from "../hooks/useBenchmarkData";
import "./pages.css";

const screen = screenBySlug("benchmarks")!;

export function BenchmarkComparisonPage() {
  const { status, error, reload } = useBenchmarkData();

  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow={screen.eyebrow}
            title={screen.headline}
            body={screen.lede}
            actions={
              <ClippedButton to="/epoch" variant="accent" size="lg">
                Replay epoch demo
              </ClippedButton>
            }
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <DataStatus status={status} error={error} onRetry={reload} variant="benchmark" />
          <div className="panel-stack">
            <ClippedCard>
              <div id="comparison">
                <BenchmarkPlaceholderPanel />
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="methodology">
                <SectionHeader
                  label="Methodology"
                  title="Reproducibility constraints"
                  description="Without these, results are anecdotal. Each constraint is recorded in the technical report."
                />
                <ul className="assumption-list">
                  {benchmarkMethodology.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="raw">
                <SectionHeader
                  label="Artifacts"
                  title="Committed outputs"
                  description="Raw JSON and plots checked into benchmarks/ after each benchmark run."
                />
                <ul className="assumption-list">
                  {benchmarkArtifacts.map((path) => (
                    <li key={path}>
                      <code>{path}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
