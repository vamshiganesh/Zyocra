import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { DataStatus } from "../components/product/DataStatus";
import { FlowNav } from "../components/product/FlowNav";
import { PlaceholderPanel } from "../components/product/PlaceholderPanel";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { usePipelineFields } from "../data/use-pipeline-fields";
import "./pages.css";

const screen = screenBySlug("verify")!;

const verifyStatusTitle: Record<string, string> = {
  idle: "Pending",
  ready: "Off-chain pass",
  running: "Running",
  verified: "On-chain pass",
  sealed: "Sealed",
};

export function ProofVerificationPage() {
  const {
    status,
    error,
    reload,
    live,
    verifyFields,
    publicInputFields,
    txSimFields,
    verifyPanelStatus,
    onChain,
  } = usePipelineFields();

  const verifyTitle = verifyStatusTitle[verifyPanelStatus] ?? "Pending";

  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow={screen.eyebrow}
            title={screen.headline}
            body={screen.lede}
            actions={
              <ClippedButton to="/score" variant="accent" size="lg">
                View score
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
              <div id="verifier">
                <SectionHeader
                  label="Verifier"
                  title="EzklRiskScoreVerifier"
                  description="Gas used here is the primary on-chain cost metric in the benchmark table."
                />
                <DataFieldGrid fields={verifyFields} columns={2} />
              </div>
              <FlowNav />
            </ClippedCard>

            <ClippedCard>
              <div id="public-inputs">
                <SectionHeader
                  label="Public inputs"
                  title="Calldata public signal set"
                  description="Must match epoch commitments and borrower feature hash at verification time."
                />
                <DataFieldGrid fields={publicInputFields} columns={2} />
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="simulation">
                <SectionHeader
                  label="Simulation"
                  title={onChain ? "Anvil broadcast" : "Foundry dry-run"}
                  description={
                    onChain
                      ? "submitScore and applyVerifiedScore executed on local Anvil."
                      : "No broadcast in demo shell. Confirms verifier and public inputs align before oracle wiring."
                  }
                />
                <PlaceholderPanel label="Verifier status" title={verifyTitle} status={verifyPanelStatus}>
                  <DataFieldGrid fields={txSimFields} columns={2} />
                  {!live ? (
                    <p className="data-grid__hint">Sync demo data or run e2e_phase1.sh for live verification fields.</p>
                  ) : null}
                </PlaceholderPanel>
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
