import { Shell } from "../components/layout/Shell";
import { ClippedButton } from "../components/ui/ClippedButton";
import { ClippedCard } from "../components/ui/ClippedCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import "./pages.css";

const values = [
  {
    num: "01",
    title: "Clarity first",
    body: "Proof statements, quantization policy, and threat boundaries are explicit—not implied.",
  },
  {
    num: "02",
    title: "Measure, then claim",
    body: "Benchmarks are the product. Compiler vs hand-optimized circuits must be comparable.",
  },
  {
    num: "03",
    title: "Local by default",
    body: "Ubuntu WSL, free tools, no paid RPCs. Reproducibility over demo theater.",
  },
  {
    num: "04",
    title: "Safe consumer actions",
    body: "Risk buckets adjust collateral parameters. Instant liquidation is out of scope.",
  },
  {
    num: "05",
    title: "Structured LoRA",
    body: "Adapters are W′ = W + AB—shared framing for EZKL export and Circom gadgets.",
  },
  {
    num: "06",
    title: "Honest non-guarantees",
    body: "Proofs attest computation, not model optimality or market-level manipulation resistance.",
  },
];

const team = [
  { name: "Research lead", role: "zkML & circuits" },
  { name: "Protocol eng", role: "Oracle & consumer" },
  { name: "ML eng", role: "Quantization & LoRA" },
  { name: "Benchmark eng", role: "Harness & gas" },
  { name: "Design", role: "Product shell" },
];

export function AboutPage() {
  return (
    <div className="page">
      <section className="band band--hero">
        <Shell>
          <div className="hero">
            <div>
              <p className="hero__eyebrow mono-label label-dot">About</p>
              <h1 className="hero__title">A focused team, building with intent.</h1>
              <p className="hero__body">
                Zyocra sits at the intersection of zkML engineering, circuit
                optimization, and on-chain DeFi integration—built as a research-grade
                benchmark, not a hype dashboard.
              </p>
              <div className="hero__actions">
                <ClippedButton to="/#benchmarks" variant="surface" size="lg">
                  See benchmarks
                </ClippedButton>
              </div>
            </div>
            <div className="about-metrics">
              <div className="about-metric">
                <p className="about-metric__value">2</p>
                <p className="about-metric__label">Proving paths</p>
              </div>
              <div className="about-metric">
                <p className="about-metric__value">5</p>
                <p className="about-metric__label">Milestones</p>
              </div>
              <div className="about-metric">
                <p className="about-metric__value">0</p>
                <p className="about-metric__label">Paid infra required</p>
              </div>
            </div>
          </div>
        </Shell>
      </section>

      <section className="band band--panels">
        <Shell>
          <div className="panel-stack">
            <ClippedCard>
              <div id="values">
                <SectionHeader
                  label="Our values"
                  title="Principles that guide how we build"
                  description="Engineering discipline for a verifiable LoRA risk oracle."
                />
                <div className="layer-list">
                  {values.map((value) => (
                    <article key={value.num} className="layer-list__item">
                      <span className="layer-list__num">{value.num}</span>
                      <h3 className="layer-list__title">{value.title}</h3>
                      <p className="layer-list__body">{value.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="team">
                <SectionHeader
                  label="Team"
                  title="People who build what they believe in."
                  description="Placeholder roster for layout parity—roles, not real identities."
                />
                <div className="team-grid">
                  {team.map((member) => (
                    <div key={member.name} className="team-cell">
                      <div className="team-avatar" aria-hidden="true" />
                      <div>
                        <p className="team-name">{member.name}</p>
                        <p className="team-role">{member.role}</p>
                      </div>
                    </div>
                  ))}
                  <div className="team-cell team-cell--empty" aria-hidden="true" />
                </div>
              </div>
            </ClippedCard>

            <ClippedCard>
              <div id="careers">
                <SectionHeader
                  label="Careers"
                  title="Join the team building structured infrastructure."
                  description="No open roles yet—this section is a static shell."
                />
                <div className="careers-list careers-list--inset">
                  {[
                    {
                      title: "Circuit engineer",
                      meta: "Research · Remote · Placeholder",
                    },
                    {
                      title: "Protocol engineer",
                      meta: "Solidity · Remote · Placeholder",
                    },
                  ].map((role) => (
                    <div key={role.title} className="careers-list__item">
                      <p className="careers-list__title">{role.title}</p>
                      <p className="careers-list__meta mono-label">{role.meta}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ClippedCard>
          </div>
        </Shell>
      </section>
    </div>
  );
}
