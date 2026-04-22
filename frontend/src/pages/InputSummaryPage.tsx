import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { FlowNav } from "../components/product/FlowNav";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import {
  inputFeatures,
  publicInputFields,
  quantizationFields,
} from "../data/product-placeholders";
import "./pages.css";

const screen = screenBySlug("inputs")!;

export function InputSummaryPage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow={screen.eyebrow}
            title={screen.headline}
            body={screen.lede}
            actions={
              <ClippedButton to="/prove" variant="accent" size="lg">
                Run prover
              </ClippedButton>
            }
            aside={<p className="mono-label">borrower · 0x9c4f…88a1</p>}
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <div className="panel-stack">
            <ClippedCard>
              <div id="vector">
                <SectionHeader
                  label="Features"
                  title="Epoch-2026-041 feature vector"
                  description="Six-dimensional tabular input to the risk MLP. Exported with deterministic ordering for ONNX and circuits."
                />
                <DataFieldGrid fields={inputFeatures} columns={3} />
              </div>
              <FlowNav />
            </ClippedCard>

            <ClippedCard>
              <div id="quantization">
                <SectionHeader
                  label="Quantization"
                  title="Fixed-point profile"
                  description="Scales must match ml-base export, EZKL settings, and Circom constants—misalignment is a benchmark failure mode."
                />
                <DataFieldGrid fields={quantizationFields} columns={3} />
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="public-inputs">
                <SectionHeader
                  label="Public inputs"
                  title="Verifier-exposed fields"
                  description="Subset of inputs and commitments passed as public signals to the Solidity verifier."
                />
                <DataFieldGrid fields={publicInputFields} columns={2} />
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
