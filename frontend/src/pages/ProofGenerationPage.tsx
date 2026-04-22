import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { FlowNav } from "../components/product/FlowNav";
import { PlaceholderPanel } from "../components/product/PlaceholderPanel";
import { ProductHero } from "../components/product/ProductHero";
import { provePaths } from "../data/content";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { circomArtifactFields, ezklArtifactFields } from "../data/product-placeholders";
import "./pages.css";

const screen = screenBySlug("prove")!;

export function ProofGenerationPage() {
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
            aside={<p className="mono-label">proof status · generated</p>}
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
                  title="Dual-path comparison"
                  description="Same borrower vector and commitments—different circuit implementations."
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
                  title="epoch-2026-041-ezkl"
                  description="Constraint snapshot, peak RAM, and proof time captured at prove completion."
                />
                <PlaceholderPanel label="Proof status" title="Generated" status="ready">
                  <p className="data-grid__hint">
                    Wire to <code>make prove</code> at Milestone 2. Status transitions: idle → running → generated → verified.
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
                  description="Identical public inputs—compare prover economics, not workload semantics."
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
