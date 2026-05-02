import { Shell } from "../components/layout/Shell";
import { BenchmarkPlaceholderPanel } from "../components/product/BenchmarkPlaceholderPanel";
import { DataStatus } from "../components/product/DataStatus";
import { ProductHero } from "../components/product/ProductHero";
import { PipelineStrip } from "../components/product/PipelineStrip";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { FaqAccordion } from "../components/ui/FaqAccordion";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatTile } from "../components/ui/StatTile";
import { headlineMetrics as benchmarkPlaceholders, overviewCopy, systemLayers } from "../data/content";
import { usePipelineFields } from "../data/use-pipeline-fields";
import { flowSteps } from "../data/product-placeholders";
import { faqItems } from "../data/placeholders";
import "./pages.css";

export function OverviewPage() {
  const c = overviewCopy;
  const { status, error, reload, headlineMetrics, live } = usePipelineFields();
  const metrics = live && headlineMetrics ? headlineMetrics : benchmarkPlaceholders;

  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <ProductHero
            eyebrow={c.hero.eyebrow}
            title={c.hero.title}
            body={c.hero.body}
            actions={
              <>
                <ClippedButton to="/epoch" variant="accent" size="lg">
                  {c.hero.ctaPrimary}
                </ClippedButton>
                <ClippedButton to="/benchmarks" variant="ghost" size="lg">
                  {c.hero.ctaSecondary}
                </ClippedButton>
              </>
            }
            aside={
              <svg className="hero__aside-svg" viewBox="0 0 240 160" fill="none" aria-hidden="true">
                <path d="M10 130C50 40 90 40 130 130C170 220 210 40 230 80" stroke="currentColor" strokeWidth="1" />
                <path d="M10 100C50 10 90 10 130 100C170 190 210 10 230 50" stroke="currentColor" strokeWidth="1" />
                <path d="M10 70C50 -20 90 -20 130 70C170 160 210 -20 230 20" stroke="currentColor" strokeWidth="1" />
              </svg>
            }
          />
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <DataStatus status={status} error={error} onRetry={reload} />
          <div className="panel-stack">
            <ClippedCard>
              <div id="flow">
                <SectionHeader
                  label={c.flow.label}
                  title={c.flow.title}
                  description={c.flow.description}
                />
                <PipelineStrip />
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="system">
                <SectionHeader
                  label={c.system.label}
                  title={c.system.title}
                  description={c.system.description}
                />
                <div className="layer-list">
                  {systemLayers.map((layer) => (
                    <article key={layer.num} className="layer-list__item">
                      <span className="layer-list__num">{layer.num}</span>
                      <h3 className="layer-list__title">{layer.title}</h3>
                      <p className="layer-list__body">{layer.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="metrics">
                <SectionHeader
                  label={c.metrics.label}
                  title={live ? "Live demo snapshot" : c.metrics.title}
                  description={
                    live
                      ? "Values from phase1-demo.json — EZKL pipeline and optional Anvil submission."
                      : c.metrics.description
                  }
                />
                <div className="stats-grid">
                  {metrics.map((m) => (
                    <StatTile
                      key={m.label}
                      label={m.label}
                      value={m.value}
                      detail={m.detail}
                      accent={m.accent}
                    />
                  ))}
                </div>
              </div>
            </ClippedCard>

            <ClippedCard>
              <BenchmarkPlaceholderPanel />
            </ClippedCard>

            <ClippedCard>
              <div id="entry">
                <SectionHeader
                  label={c.entry.label}
                  title={c.entry.title}
                  description={c.entry.description}
                />
                <div className="hero__actions" style={{ marginTop: "var(--space-6)" }}>
                  <ClippedButton to={flowSteps[0].path} variant="accent" size="md">
                    Start pipeline
                  </ClippedButton>
                  <ClippedButton to="/threat-model" variant="surface" size="md">
                    Threat model
                  </ClippedButton>
                </div>
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="faq">
                <SectionHeader
                  label={c.faq.label}
                  title={c.faq.title}
                  description={c.faq.description}
                />
                <FaqAccordion items={faqItems} />
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
