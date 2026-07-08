import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
import { BenchmarkPlaceholderPanel } from "../components/product/BenchmarkPlaceholderPanel";
import { DataStatus } from "../components/product/DataStatus";
import { benchmarkArtifacts, benchmarkMethodology } from "../data/content";
import { ProductHero } from "../components/product/ProductHero";
import { RunEpochDemoButton } from "../components/product/RunEpochDemoButton";
import { ClippedButton } from "../components/ui/ClippedButton";
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
              <>
                <RunEpochDemoButton variant="accent" size="lg">
                  Operator dashboard
                </RunEpochDemoButton>
                <ClippedButton to="/epoch" variant="ghost" size="lg">
                  Epoch registry
                </ClippedButton>
              </>
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
              <div id="paths">
                <SectionHeader
                  label="Prover paths"
                  title="Matched head · asymmetric full · hybrid"
                  description="Primary research claim is structured LoRA head proving. Full-graph EZKL is the end-to-end oracle path; Circom optimizes adapter updates."
                />
                <ul className="assumption-list">
                  <li>
                    <strong>Matched (fair):</strong> EZKL head-only ONNX vs Circom <code>lora_output_head</code> on the same{" "}
                    <code>hidden[8] → logit</code> statement.
                  </li>
                  <li>
                    <strong>Asymmetric (system):</strong> EZKL full 6→16→8→1+sigmoid vs Circom head — different workloads; ratios are not bakeoff wins.
                  </li>
                  <li>
                    <strong>Hybrid:</strong> one EZKL full prove per epoch + Circom head proves per adapter update — amortized cost below.
                  </li>
                  <li>Operator: EZKL runs <code>e2e_phase1.sh</code>; Circom runs <code>e2e_circom.sh</code>. Benchmarks use{" "}
                    <code>make head-benchmark</code>.
                  </li>
                </ul>
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
