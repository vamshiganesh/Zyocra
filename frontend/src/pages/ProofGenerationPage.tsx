import { Shell } from "../components/layout/Shell";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { FlowNav } from "../components/product/FlowNav";
import { PlaceholderPanel } from "../components/product/PlaceholderPanel";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { circomRun, proveRun } from "../data/product-placeholders";
import "./pages.css";

const ezklFields = [
  { label: "constraints", value: proveRun.constraints, mono: true },
  { label: "peak_ram", value: proveRun.peakRam, mono: true },
  { label: "proof_time", value: proveRun.proofTime, mono: true },
  { label: "proof_size", value: proveRun.proofSize, mono: true },
  { label: "artifact", value: proveRun.artifactPath, mono: true },
];

const circomFields = [
  { label: "constraints", value: circomRun.constraints, mono: true },
  { label: "peak_ram", value: circomRun.peakRam, mono: true },
  { label: "proof_time", value: circomRun.proofTime, mono: true },
  { label: "proof_size", value: circomRun.proofSize, mono: true },
  { label: "artifact", value: circomRun.artifactPath, mono: true },
];

export function ProofGenerationPage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow="Off-chain prover"
            title="Generate the epoch risk proof."
            body="Run EZKL baseline or Circom custom path. Prover outputs land in circuits-baseline/ or circuits-custom/."
            actions={
              <ClippedButton to="/verify" variant="accent" size="lg">
                Verify on-chain
              </ClippedButton>
            }
            aside={<p className="mono-label">prover: local CPU</p>}
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <div className="panel-stack">
            <ClippedCard>
              <div id="path">
                <SectionHeader
                  label="Proving path"
                  title="Dual-path benchmark"
                  description="Select which path to run. Milestone 2 ships EZKL; Milestone 3 ships Circom LoRA subgraph."
                />
                <div className="path-toggle">
                  <article className="path-toggle__card path-toggle__card--active">
                    <p className="path-toggle__name">EZKL baseline</p>
                    <p className="path-toggle__desc">
                      ONNX → EZKL compile → setup → proof → Solidity verifier generation.
                    </p>
                  </article>
                  <article className="path-toggle__card">
                    <p className="path-toggle__name">Circom custom</p>
                    <p className="path-toggle__desc">
                      LoRA delta W′ = W + AB, dense dot-product, optional activation approximation.
                    </p>
                  </article>
                </div>
              </div>
              <FlowNav />
            </ClippedCard>

            <ClippedCard>
              <div id="prover">
                <SectionHeader
                  label="Prover run"
                  title="Last prover invocation"
                  description="Placeholder shell for prove job status, logs, and constraint snapshot."
                />
                <PlaceholderPanel label="Job" title="epoch-2026-041-ezkl" status="ready">
                  <p className="data-grid__hint">
                    Run <code>make prove</code> after Milestone 2 to populate constraints, RAM, and proof time.
                  </p>
                </PlaceholderPanel>
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="artifacts">
                <SectionHeader
                  label="Artifacts"
                  title="Proof outputs on disk"
                  description="Raw proof bytes, witness, and verifier metadata paths."
                />
                <DataFieldGrid fields={ezklFields} columns={2} />
                <SectionHeader
                  label="Circom path"
                  title="Parallel artifact slot"
                  description="Same logical workload for apples-to-apples benchmarks."
                />
                <DataFieldGrid fields={circomFields} columns={2} />
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
