import { Shell } from "../components/layout/Shell";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { changelog } from "../data/placeholders";
import "./pages.css";

export function UpdatesPage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow="Release notes"
            title="Milestone and circuit updates."
            body="Versioned changes across ml-base, circuits-baseline, circuits-custom, contracts, and benchmarks."
            aside={<p className="mono-label">zyocra://updates</p>}
          />
        </Shell>
      </section>

      <section className="band band--panels" id="changelog">
        <Shell>
          <div className="panel-stack">
            {changelog.map((entry) => (
              <ClippedCard key={entry.version}>
                <div className="changelog__meta">
                  <span className="changelog__version">{entry.version}</span>
                  <span className="changelog__date">{entry.date}</span>
                </div>
                <SectionHeader
                  label="Release"
                  title="Product shell and screen architecture"
                  description="Screen routes and placeholder data—no prover or contract wiring yet."
                />
                <div className="changelog">
                  {entry.items.map((item) => (
                    <div key={item.text} className="changelog__item">
                      <span className="changelog__tag">{item.tag}</span>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
              </ClippedCard>
            ))}
          </div>
        </Shell>
      </section>
    </div>
  );
}
