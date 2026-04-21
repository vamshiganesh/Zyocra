import { Shell } from "../components/layout/Shell";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import {
  assumptionItems,
  guaranteeItems,
  nonGuaranteeItems,
} from "../data/product-placeholders";
import "./pages.css";

function ProseList({
  items,
  dark = false,
}: {
  items: { title: string; body: string }[];
  dark?: boolean;
}) {
  return (
    <div className={`prose-list${dark ? " prose-list--dark" : ""}`}>
      {items.map((item) => (
        <article key={item.title} className="prose-list__item">
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </article>
      ))}
    </div>
  );
}

export function ThreatModelPage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow="Security scope"
            title="Guarantees and explicit non-guarantees."
            body="What the proof system attests, what the oracle enforces on-chain, and what remains outside scope."
            actions={
              <ClippedButton to="/epoch" variant="accent" size="lg">
                Start demo pipeline
              </ClippedButton>
            }
            aside={<p className="mono-label">docs/threat-model.md</p>}
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <div className="panel-stack">
            <ClippedCard>
              <div id="guarantees">
                <SectionHeader
                  label="Guarantees"
                  title="What Zyocra proves"
                  description="Strong claims limited to correct inference under declared artifacts."
                />
                <ProseList items={guaranteeItems} />
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="non-guarantees">
                <SectionHeader
                  label="Non-guarantees"
                  title="Out of scope"
                  description="DeFi risk literature separates proof correctness from market-level oracle security."
                />
                <ProseList items={nonGuaranteeItems} />
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="assumptions">
                <SectionHeader
                  label="Assumptions"
                  title="Trusted setup and artifact alignment"
                  description="Violations break correctness even when contracts behave as specified."
                />
                <ul className="assumption-list">
                  {assumptionItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
