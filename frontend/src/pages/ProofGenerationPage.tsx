import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { DataStatus } from "../components/product/DataStatus";
import { FlowNav } from "../components/product/FlowNav";
import { PlaceholderPanel } from "../components/product/PlaceholderPanel";
import { ProductHero } from "../components/product/ProductHero";
import { provePaths } from "../data/content";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { circomArtifactFields } from "../data/product-placeholders";
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
    epochId,
    ezklArtifactFields,
    proofPanelStatus,
  } = usePipelineFields();

  const proofTitle = proofStatusTitle[proofPanelStatus] ?? "Pending";

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
                  description="Same borrower vector and commitments with different circuit implementations."
                />
                <div className="path-toggle">
                  <article className="path-toggle__card path-toggle__card--active">
                    <p className="path-toggle__name">{provePaths.ezkl.name}</p>
                    <p className="path-toggle__desc">{provePaths.ezkl.description}</p>
                  </article>
                  <article className="path-toggle__card">
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
                  title={`${epochId}-ezkl`}
                  description="Constraint snapshot, peak RAM, and proof time captured at prove completion."
                />
                <PlaceholderPanel label="Proof status" title={proofTitle} status={proofPanelStatus}>
                  <p className="data-grid__hint">
                    {live
                      ? "Proof bytes from circuits-baseline/proofs/proof.json. Off-chain ezkl.verify() reflected in artifacts panel."
                      : "Run bash scripts/sync-frontend-data.sh after the EZKL pipeline to populate proof status."}
                  </p>
                </PlaceholderPanel>
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="artifacts">
                <SectionHeader
                  label="Artifacts"
                  title="EZKL baseline outputs"
                  description="Proof size and peak RAM are first-class benchmark metrics alongside constraint count."
                />
                <DataFieldGrid fields={ezklArtifactFields} columns={2} />
                <SectionHeader
                  label="Circom path"
                  title="Parallel artifact slot"
                  description="Identical public inputs. Compare prover economics, not workload semantics."
                />
                <DataFieldGrid fields={circomArtifactFields} columns={2} />
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
