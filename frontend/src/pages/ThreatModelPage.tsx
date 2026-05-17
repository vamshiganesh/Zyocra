import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
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

const screen = screenBySlug("threat-model")!;

function ProseList({ items }: { items: { title: string; body: string }[] }) {
  return (
    <div className="prose-list">
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
            eyebrow={screen.eyebrow}
            title={screen.headline}
            body={screen.lede}
            actions={
              <ClippedButton to="/epoch" variant="accent" size="lg">
                Run pipeline demo
              </ClippedButton>
            }
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
                  title="Cryptographic and on-chain bounds"
                  description="Claims limited to correct inference under committed artifacts—not economic optimality."
                />
                <ProseList items={guaranteeItems} />
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="non-guarantees">
                <SectionHeader
                  label="Non-guarantees"
                  title="Explicitly out of scope"
                  description="Separates proof correctness from DeFi market risk and oracle manipulation literature."
                />
                <ProseList items={nonGuaranteeItems} />
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="assumptions">
                <SectionHeader
                  label="Assumptions"
                  title="Operational dependencies"
                  description="Failure of any assumption breaks end-to-end security even if contracts match spec."
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
