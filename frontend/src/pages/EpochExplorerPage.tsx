import { Shell } from "../components/layout/Shell";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { EpochTable } from "../components/product/EpochTable";
import { FlowNav } from "../components/product/FlowNav";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { demoEpoch, epochRegistry } from "../data/product-placeholders";
import "./pages.css";

const commitmentFields = [
  { label: "onnx_commit", value: demoEpoch.onnxCommit, mono: true },
  { label: "model_hash", value: demoEpoch.modelHash, mono: true },
  { label: "adapter_hash", value: demoEpoch.adapterHash, mono: true },
  { label: "quant_profile", value: demoEpoch.quantProfile, mono: true },
  { label: "verifier_ezkl", value: demoEpoch.verifierEzkl, mono: true },
  { label: "verifier_circom", value: demoEpoch.verifierCircom, mono: true },
];

export function EpochExplorerPage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow="Epoch registry"
            title="Select the scoring epoch."
            body="Each epoch binds a model hash, adapter commitments, quantization profile, and verifier deployment."
            actions={
              <ClippedButton to="/inputs" variant="accent" size="lg">
                Continue to inputs
              </ClippedButton>
            }
            aside={<p className="mono-label">{demoEpoch.id}</p>}
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <div className="panel-stack">
            <ClippedCard>
              <div id="active">
                <SectionHeader
                  label="Active epoch"
                  title={demoEpoch.id}
                  description={`Status: ${demoEpoch.status} · block ${demoEpoch.blockHeight} · ${demoEpoch.scoredAt}`}
                />
                <DataFieldGrid fields={commitmentFields} columns={3} />
              </div>
              <FlowNav />
            </ClippedCard>

            <ClippedCard>
              <div id="registry">
                <SectionHeader
                  label="Registry"
                  title="Historical epochs"
                  description="Sealed epochs retain verifier and commitment snapshots for reproducibility."
                />
                <EpochTable rows={epochRegistry} />
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="commitments">
                <SectionHeader
                  label="Commitments"
                  title="Public statement inputs"
                  description="Hashes committed on-chain before proof submission for epoch-2026-041."
                />
                <DataFieldGrid fields={commitmentFields.slice(0, 4)} columns={2} />
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
