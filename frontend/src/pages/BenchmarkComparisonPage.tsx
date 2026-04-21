import { Shell } from "../components/layout/Shell";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { BenchmarkPanel } from "../components/ui/BenchmarkPanel";
import { SectionHeader } from "../components/ui/SectionHeader";
import { benchmarkRows } from "../data/placeholders";
import "./pages.css";

const methodology = [
  "Same machine spec documented in benchmarks/scripts/README.",
  "Same model family, quantization level, and public input policy.",
  "Same input batch: single borrower vector for epoch-2026-041.",
  "Gas measured via Foundry gas snapshot on local Anvil.",
];

export function BenchmarkComparisonPage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow="Research artifact"
            title="EZKL baseline vs Circom LoRA path."
            body="Apples-to-apples comparison on constraint count, prover RAM, proof time, verification gas, proof size, and quantization error."
            actions={
              <ClippedButton to="/epoch" variant="accent" size="lg">
                Run demo epoch
              </ClippedButton>
            }
            aside={<p className="mono-label">benchmarks/raw-results/</p>}
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <div className="panel-stack">
            <ClippedCard>
              <div id="comparison">
                <SectionHeader
                  label="Comparison"
                  title="Headline benchmark table"
                  description="Values populate at Milestone 5. Structure matches technical report."
                />
                <BenchmarkPanel rows={benchmarkRows} />
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="methodology">
                <SectionHeader
                  label="Methodology"
                  title="Reproducibility constraints"
                  description="Without explicit methodology the repo reads as a demo—not an engineering study."
                />
                <ul className="assumption-list">
                  {methodology.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="raw">
                <SectionHeader
                  label="Raw results"
                  title="Artifact paths"
                  description="Committed JSON + plots under benchmarks/ after benchmark runs."
                />
                <ul className="assumption-list">
                  <li>benchmarks/raw-results/ezkl-epoch-2026-041.json</li>
                  <li>benchmarks/raw-results/circom-epoch-2026-041.json</li>
                  <li>benchmarks/plots/constraints-diff.svg</li>
                  <li>benchmarks/plots/gas-verify.svg</li>
                </ul>
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
