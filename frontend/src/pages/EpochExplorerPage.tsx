import { useMemo } from "react";
import { EMPTY_VALUE } from "../lib/display";
import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { DataStatus } from "../components/product/DataStatus";
import { EpochTable } from "../components/product/EpochTable";
import { FlowNav } from "../components/product/FlowNav";
import { ProductHero } from "../components/product/ProductHero";
import { RunEpochDemoButton } from "../components/product/RunEpochDemoButton";
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
    chainLive,
    chainEnabled,
  } = usePipelineFields();

  const modelField = epochDetailFields.find((f) => f.label === "Model hash");
  const adapterField = epochDetailFields.find((f) => f.label === "Adapter hash");

  const hashPreflight = useMemo(() => {
    const committedModel = chainLive?.modelHash ?? modelField?.title ?? modelField?.value;
    const committedAdapter = chainLive?.adapterHash ?? adapterField?.title ?? adapterField?.value;
    return {
      committedModel,
      committedAdapter,
      ready: Boolean(committedModel && committedAdapter),
    };
  }, [adapterField, chainLive, modelField]);

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
              <>
                <RunEpochDemoButton variant="accent" size="lg" autoRun>
                  Run epoch demo
                </RunEpochDemoButton>
                <ClippedButton to="/inputs" variant="ghost" size="lg">
                  Review inputs
                </ClippedButton>
              </>
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
              <div id="registry-preflight">
                <SectionHeader
                  label="Epoch registry"
                  title="Model / adapter commitments"
                  description="Hashes are immutable at RiskOracle deploy. Proofs must match these commitments before submitScore."
                />
                <DataFieldGrid
                  fields={[
                    {
                      label: "Committed model hash",
                      value: hashPreflight.committedModel
                        ? `${hashPreflight.committedModel.slice(0, 14)}…`
                        : EMPTY_VALUE,
                      title: hashPreflight.committedModel,
                      mono: true,
                      hint: chainEnabled ? "live" : "json",
                    },
                    {
                      label: "Committed adapter hash",
                      value: hashPreflight.committedAdapter
                        ? `${hashPreflight.committedAdapter.slice(0, 14)}…`
                        : EMPTY_VALUE,
                      title: hashPreflight.committedAdapter,
                      mono: true,
                      hint: chainEnabled ? "live" : "json",
                    },
                    {
                      label: "Pre-flight",
                      value: hashPreflight.ready ? "Hashes loaded" : "Missing commitments",
                      mono: true,
                      description: hashPreflight.ready
                        ? "Operator run epoch demo checks oracle-payload.json against these hashes."
                        : "Deploy oracle stack or sync phase1-demo.json first.",
                    },
                  ]}
                  columns={3}
                />
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="registry">
                <SectionHeader
                  label="History"
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
