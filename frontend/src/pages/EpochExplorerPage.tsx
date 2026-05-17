import { EMPTY_VALUE } from "../lib/display";
import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { DataStatus } from "../components/product/DataStatus";
import { EpochTable } from "../components/product/EpochTable";
import { FlowNav } from "../components/product/FlowNav";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { usePipelineFields } from "../data/use-pipeline-fields";
import "./pages.css";

const screen = screenBySlug("epoch")!;

export function EpochExplorerPage() {
  const {
    status,
    error,
    reload,
    epochId,
    epochDetailFields,
    epochRegistry,
    onChain,
  } = usePipelineFields();

  const proofField = epochDetailFields.find((f) => f.label === "Proof status");
  const verifierField = epochDetailFields.find((f) => f.label === "Verifier status");

  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow={screen.eyebrow}
            title={screen.headline}
            body={screen.lede}
            actions={
              <ClippedButton to="/inputs" variant="accent" size="lg">
                Review inputs
              </ClippedButton>
            }
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <DataStatus status={status} error={error} onRetry={reload} />
          <div className="panel-stack">
            <ClippedCard>
              <div id="active">
                <SectionHeader
                  label="Active epoch"
                  title={epochId}
                  description={`${onChain ? "On-chain submission" : "Local artifacts"} · proof ${proofField?.value ?? EMPTY_VALUE} · verifier ${verifierField?.value ?? EMPTY_VALUE}`}
                />
                <DataFieldGrid fields={epochDetailFields} columns={3} />
              </div>
              <FlowNav />
            </ClippedCard>

            <ClippedCard>
              <div id="registry">
                <SectionHeader
                  label="Registry"
                  title="Prior epochs"
                  description="Sealed epochs freeze verifier addresses and commitments for audit replay."
                />
                <EpochTable rows={epochRegistry} />
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="commitments">
                <SectionHeader
                  label="Commitments"
                  title="On-chain statement anchors"
                  description="Hashes registered in RiskOracle before submitScore accepts a proof for this epoch."
                />
                <DataFieldGrid
                  fields={epochDetailFields.filter((f) =>
                    ["Model hash", "Adapter hash", "ONNX commit", "Quantization profile"].includes(f.label),
                  )}
                  columns={2}
                />
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
