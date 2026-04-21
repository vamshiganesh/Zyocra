import { Shell } from "../components/layout/Shell";
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

export function InputSummaryPage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow="Feature vector"
            title="Borrower features for epoch scoring."
            body="Deterministic tabular inputs from ml-base—exported as fixed-point tensors matching the ONNX graph."
            actions={
              <ClippedButton to="/prove" variant="accent" size="lg">
                Generate proof
              </ClippedButton>
            }
            aside={<p className="mono-label">borrower 0x9c4f…88a1</p>}
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <div className="panel-stack">
            <ClippedCard>
              <div id="vector">
                <SectionHeader
                  label="Feature vector"
                  title="Epoch-2026-041 inputs"
                  description="Six-feature tabular vector for liquidation-risk MLP. Values are illustrative."
                />
                <DataFieldGrid fields={inputFeatures} columns={3} />
              </div>
              <FlowNav />
            </ClippedCard>

            <ClippedCard>
              <div id="quantization">
                <SectionHeader
                  label="Quantization"
                  title="Fixed-point configuration"
                  description="Scale factors and LoRA rank must match circuits-baseline and circuits-custom artifacts."
                />
                <DataFieldGrid fields={quantizationFields} columns={3} />
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="public-inputs">
                <SectionHeader
                  label="Public inputs"
                  title="Statement exposure policy"
                  description="Fields exposed to the verifier as public inputs for epoch-2026-041."
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
