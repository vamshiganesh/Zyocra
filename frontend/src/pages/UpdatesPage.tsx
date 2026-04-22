import { Shell } from "../components/layout/Shell";
import { screenBySlug } from "../config/screens";
import { ProductHero } from "../components/product/ProductHero";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { changelog } from "../data/placeholders";
import "./pages.css";

const screen = screenBySlug("updates")!;

export function UpdatesPage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow={screen.eyebrow}
            title={screen.headline}
            body={screen.lede}
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
                  title={entry.title}
                  description={entry.description}
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
