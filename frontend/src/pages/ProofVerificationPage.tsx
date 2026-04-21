import { Shell } from "../components/layout/Shell";
import { DataFieldGrid } from "../components/product/DataFieldGrid";
import { FlowNav } from "../components/product/FlowNav";
import { PlaceholderPanel } from "../components/product/PlaceholderPanel";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { publicInputFields, verifyFields } from "../data/product-placeholders";
import "./pages.css";

const txSimFields = [
  { label: "from", value: "0xf39F…2266", mono: true },
  { label: "to", value: "RiskOracleV1", mono: true },
  { label: "calldata_size", value: "— bytes", mono: true },
  { label: "estimated_gas", value: "—", mono: true },
  { label: "result", value: "verify() → true (simulated)", mono: true },
];

export function ProofVerificationPage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow="On-chain verifier"
            title="Verify the proof on EVM."
            body="Submit proof bytes and public inputs to the deployed Solidity verifier via Foundry / Anvil."
            actions={
              <ClippedButton to="/score" variant="accent" size="lg">
                View risk score
              </ClippedButton>
            }
            aside={<p className="mono-label">chain: anvil-local</p>}
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
                  description="Oracle rejects submissions when proof does not verify against expected verifier and commitments."
                />
                <DataFieldGrid fields={verifyFields} columns={2} />
              </div>
              <FlowNav />
            </ClippedCard>

            <ClippedCard>
              <div id="public-inputs">
                <SectionHeader
                  label="Public inputs"
                  title="Verifier input set"
                  description="Must match values committed in epoch-2026-041 and exported from ml-base."
                />
                <DataFieldGrid fields={publicInputFields} columns={2} />
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="simulation">
                <SectionHeader
                  label="Tx simulation"
                  title="Foundry dry-run"
                  description="Gas and revert reason before oracle submission. Not broadcast in shell mode."
                />
                <PlaceholderPanel label="Simulation" title="submitScore()" status="ready">
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
