import { Shell } from "../components/layout/Shell";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import type { LegalSection } from "../data/content";
import { privacyCopy, termsCopy } from "../data/content";
import "./pages.css";

function LegalBody({ sections }: { sections: LegalSection[] }) {
  return (
    <div className="prose-list">
      {sections.map((section) => (
        <article key={section.title} className="prose-list__item">
          <h3>{section.title}</h3>
          <p>{section.body}</p>
        </article>
      ))}
    </div>
  );
}

export function TermsPage() {
  const copy = termsCopy;
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow={copy.eyebrow}
            title={copy.title}
            body={copy.lede}
            aside={<p className="mono-label">{copy.updated}</p>}
          />
        </Shell>
      </section>
      <section className="band band--panels">
        <Shell>
          <ClippedCard>
            <SectionHeader label="Terms" title="Usage conditions" description={copy.updated} />
            <LegalBody sections={copy.sections} />
          </ClippedCard>
        </Shell>
      </section>
    </div>
  );
}

export function PrivacyPage() {
  const copy = privacyCopy;
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow={copy.eyebrow}
            title={copy.title}
            body={copy.lede}
            aside={<p className="mono-label">{copy.updated}</p>}
          />
        </Shell>
      </section>
      <section className="band band--panels">
        <Shell>
          <ClippedCard>
            <SectionHeader label="Privacy" title="Data handling" description={copy.updated} />
            <LegalBody sections={copy.sections} />
          </ClippedCard>
        </Shell>
      </section>
    </div>
  );
}
