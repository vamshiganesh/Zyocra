import { Link } from "react-router-dom";
import { footerCopy } from "../../data/content";
import { PipelineStartButton } from "../product/PipelineStartButton";
import "./SiteFooter.css";

const pages = [
  { to: "/", label: "Overview" },
  { to: "/epoch", label: "Epoch explorer" },
  { to: "/benchmarks", label: "Benchmarks" },
  { to: "/threat-model", label: "Threat model" },
  { to: "/updates", label: "Updates" },
];

const social = [
  { href: "#", label: "Telegram" },
  { href: "#", label: "Youtube" },
  { href: "#", label: "Linkedin" },
  { href: "#", label: "Discord" },
  { href: "#", label: "Github" },
  { href: "#", label: "X" },
];

const badges = [
  { id: "gdpr", label: "GDPR" },
  { id: "soc2", label: "SOC 2" },
  { id: "iso", label: "ISO" },
];

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.getElementById("top")?.focus({ preventScroll: true });
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="band band--footer">
        <div className="shell shell--split">
          <div className="shell__rail-slot site-footer__rail">
            <button
              type="button"
              className="site-footer__back"
              onClick={scrollToTop}
            >
              <span className="site-footer__back-icon" aria-hidden="true">
                ↑
              </span>
              Back to top
            </button>

            <ul className="site-footer__badges">
              {badges.map((badge) => (
                <li key={badge.id} className="site-footer__badge">
                  <span className="site-footer__badge-ring" aria-hidden="true">
                    <svg viewBox="0 0 48 48" width="40" height="40">
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="2 3"
                      />
                      <path
                        d="M24 14L30 24L24 34L18 24Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </svg>
                  </span>
                  <span className="site-footer__badge-label">{badge.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="shell__main site-footer__upper-main">
            <div className="site-footer__cta">
              <div className="site-footer__status">
                <p className="mono-label label-dot site-footer__status-label">
                  {footerCopy.status}
                </p>
                <span
                  className="site-footer__status-hatch hatch-dark"
                  aria-hidden="true"
                />
              </div>
              <h2 className="site-footer__headline">
                {footerCopy.headline.split("\n").map((line, i) => (
                  <span key={line}>
                    {i > 0 ? <br /> : null}
                    {line}
                  </span>
                ))}
              </h2>
              <p className="site-footer__lede">{footerCopy.lede}</p>
              <PipelineStartButton variant="surface" size="lg">
                {footerCopy.cta}
              </PipelineStartButton>
            </div>

            <div className="site-footer__aside">
              <div className="site-footer__waves hatch-dark" aria-hidden="true">
                <svg
                  className="site-footer__waves-svg"
                  viewBox="0 0 280 140"
                  fill="none"
                >
                  <path
                    d="M8 120C48 40 88 40 128 120C168 200 208 40 272 80"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <path
                    d="M8 95C48 15 88 15 128 95C168 175 208 15 272 55"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <path
                    d="M8 70C48 -10 88 -10 128 70C168 150 208 -10 272 30"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </svg>
              </div>

              <div className="site-footer__link-cols">
                <div>
                  <p className="site-footer__col-title mono-label">Pages</p>
                  <ul className="site-footer__link-list">
                    {pages.map((item) => (
                      <li key={item.label}>
                        <Link to={item.to}>{item.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="site-footer__col-title mono-label">Social</p>
                  <ul className="site-footer__link-list">
                    {social.map((item) => (
                      <li key={item.label}>
                        <a href={item.href}>{item.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="band band--footer site-footer__banner-band">
        <div className="shell">
          <div className="site-footer__banner">
            <div className="site-footer__banner-top">
              <div className="site-footer__stats">
                <div className="site-footer__stat">
                  <span className="site-footer__stat-kicker mono-label">
                    Active
                  </span>
                  <span className="site-footer__stat-value">Oracle Status</span>
                </div>
                <div className="site-footer__stat">
                  <span className="site-footer__stat-kicker mono-label">
                    12,745,012
                  </span>
                  <span className="site-footer__stat-value">Scores Attested</span>
                </div>
              </div>
              <p className="site-footer__banner-copy">
                Zyocra is a zkML operator for DeFi risk controls. It proves
                LoRA-adapted inference off-chain and updates collateral parameters
                on-chain—with full verification and control.
              </p>
            </div>
            <p className="site-footer__wordmark" aria-label="Zyocra">
              <span className="site-footer__wordmark-solid">Zyocra</span>
              <span className="site-footer__wordmark-stipple" aria-hidden="true">
                Zyocra
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="band band--footer-legal">
        <div className="shell">
          <div className="site-footer__legal">
            <p className="site-footer__copyright">© Zyocra, 2026</p>
            <div className="site-footer__legal-links">
              <span>All rights reserved</span>
              <a href="#terms">Terms of use</a>
              <a href="#privacy">Privacy Policy</a>
              <span className="site-footer__legal-mark" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="14" height="14">
                  <path d="M8 1L14 8L8 15L2 8L8 1Z" fill="currentColor" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
