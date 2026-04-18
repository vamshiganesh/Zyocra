import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { changelog } from "../data/placeholders";
import "./pages.css";

export function UpdatesPage() {
  return (
    <div className="page page--wide stack--loose">
      <section className="hero">
        <div>
          <p className="hero__eyebrow mono-label label-dot">Changelog</p>
          <h1 className="hero__title">What&apos;s new in Zyocra.</h1>
          <p className="hero__body">
            Static release notes for the product shell. Pipeline and circuit
            updates will land here as milestones ship.
          </p>
        </div>
        <div className="hero__aside hatch-dark">
          <p className="mono-label">zyocra://updates</p>
        </div>
      </section>

      <div className="panel-stack" id="changelog">
        {changelog.map((entry) => (
          <ClippedCard key={entry.version}>
            <div className="changelog__meta">
              <span className="changelog__version">{entry.version}</span>
              <span className="changelog__date">{entry.date}</span>
            </div>
            <SectionHeader
              label="Release"
              title="UI shell and monorepo foundation"
              description="No backend wiring yet—design system and static pages only."
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
    </div>
  );
}
