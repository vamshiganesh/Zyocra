import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { FlowNav } from "../components/product/FlowNav";
import { PlaceholderPanel } from "../components/product/PlaceholderPanel";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { publicInputFields, verifyFields } from "../data/product-placeholders";
import "./pages.css";

const screen = screenBySlug("verify")!;

const txSimFields = [
  {
    label: "Caller",
    value: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    mono: true,
    description: "Foundry default deployer for local simulation.",
  },
  {
    label: "Target",
    value: "RiskOracle.submitScore",
    mono: true,
    description: "Oracle entrypoint after standalone verify() passes.",
  },
  {
    label: "Gas used",
    value: "—",
    mono: true,
    description: "Total gas for verify + oracle write path in integration test.",
    hint: "gas_report",
  },
  {
    label: "Result",
    value: "verify() → true",
    mono: true,
    description: "Simulated verifier outcome for attached proof bytes.",
  },
];

export function ProofVerificationPage() {
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
            aside={<p className="mono-label">verifier status · simulated pass</p>}
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <div className="panel-stack">
            <ClippedCard>
              <div id="verifier">
                <SectionHeader
                  label="Verifier"
                  title="RiskScoreVerifierV1"
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
                  title="Foundry dry-run"
                  description="No broadcast in demo shell—confirms verifier and public inputs align before oracle wiring."
                />
                <PlaceholderPanel label="Verifier status" title="Simulated pass" status="verified">
                  <DataFieldGrid fields={txSimFields} columns={2} />
                </PlaceholderPanel>
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
