import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { DataStatus } from "../components/product/DataStatus";
import { FlowNav } from "../components/product/FlowNav";
import { PlaceholderPanel } from "../components/product/PlaceholderPanel";
import { ProductHero } from "../components/product/ProductHero";
import { provePaths } from "../data/content";
import { circomArtifactFields, ezklArtifactFields } from "../data/product-placeholders";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { usePipelineFields } from "../data/use-pipeline-fields";
import "./pages.css";

const screen = screenBySlug("prove")!;

const proofStatusTitle: Record<string, string> = {
  idle: "Pending",
  ready: "Generated",
  running: "Running",
  verified: "Verified",
  sealed: "Sealed",
};

export function ProofGenerationPage() {
  const {
    status,
    error,
    reload,
    live,
    prover,
    epochId,
    artifactFields,
    proofPanelStatus,
  } = usePipelineFields();

  const isCircom = prover === "circom";
  const proofTitle = proofStatusTitle[proofPanelStatus] ?? "Pending";
  const compareFields = isCircom ? ezklArtifactFields : circomArtifactFields;

  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow={screen.eyebrow}
            title={screen.headline}
            body={screen.lede}
            actions={
              <ClippedButton to="/verify" variant="accent" size="lg">
                Verify proof
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
              <div id="path">
                <SectionHeader
                  label="Proving path"
                  title="Dual-path comparison"
                  description="Same borrower and commitments with different circuit implementations. Active path reflects synced demo data."
                />
                <div className="path-toggle">
                  <article
                    className={`path-toggle__card${!isCircom ? " path-toggle__card--active" : ""}`}
                  >
                    <p className="path-toggle__name">{provePaths.ezkl.name}</p>
                    <p className="path-toggle__desc">{provePaths.ezkl.description}</p>
                  </article>
                  <article
                    className={`path-toggle__card${isCircom ? " path-toggle__card--active" : ""}`}
                  >
                    <p className="path-toggle__name">{provePaths.circom.name}</p>
                    <p className="path-toggle__desc">{provePaths.circom.description}</p>
                  </article>
                </div>
              </div>
              <FlowNav />
            </ClippedCard>

            <ClippedCard>
              <div id="prover">
                <SectionHeader
                  label="Prover run"
                  title={`${epochId}-${prover}`}
                  description={
                    isCircom
                      ? "LoRA head Groth16 proof with hidden[8] + logit_acc public signals."
                      : "Constraint snapshot, peak RAM, and proof time captured at prove completion."
                  }
                />
                <PlaceholderPanel label="Proof status" title={proofTitle} status={proofPanelStatus}>
                  <p className="data-grid__hint">
                    {live
                      ? isCircom
                        ? "Proof bytes from circuits-custom/proofs/proof.json. Submitted via e2e_circom.sh → RiskOracle."
                        : "Proof bytes from circuits-baseline/proofs/proof.json. Off-chain ezkl.verify() reflected in artifacts panel."
                      : "Run bash scripts/e2e_phase1.sh or e2e_circom.sh, then sync-frontend-data.sh to populate proof status."}
                  </p>
                </PlaceholderPanel>
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="artifacts">
                <SectionHeader
                  label="Artifacts"
                  title={isCircom ? "Circom head outputs" : "EZKL baseline outputs"}
                  description={
                    isCircom
                      ? "Groth16 proof artifacts for the LoRA output head oracle path."
                      : "Proof size and peak RAM are first-class benchmark metrics alongside constraint count."
                  }
                />
                <DataFieldGrid fields={artifactFields} columns={2} />
                <SectionHeader
                  label="Compare"
                  title={isCircom ? "EZKL full graph (reference)" : "Circom head (reference)"}
                  description="Benchmark comparison row, workloads differ; use make benchmark for economics."
                />
                <DataFieldGrid fields={compareFields} columns={2} />
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
