import { Link, useLocation } from "react-router-dom";
import { PIPELINE_SCREENS } from "../../config/screens";
import "./product.css";

export function FlowNav() {
  const { pathname } = useLocation();
  const index = PIPELINE_SCREENS.findIndex((s) => s.path === pathname);
  if (index === -1) return null;

  const prev = PIPELINE_SCREENS[index - 1];
  const next = PIPELINE_SCREENS[index + 1];

  return (
    <nav className="flow-nav" aria-label="Pipeline navigation">
      {prev ? (
        <Link to={prev.path} className="flow-nav__link flow-nav__link--prev">
          <span className="flow-nav__dir mono-label">Previous</span>
          <span className="flow-nav__label">{prev.shortLabel}</span>
        </Link>
      ) : (
        <span className="flow-nav__spacer" />
      )}
      <span className="flow-nav__step mono-label">
        Step {PIPELINE_SCREENS[index].pipelineStep} / {PIPELINE_SCREENS.length}
      </span>
      {next ? (
        <Link to={next.path} className="flow-nav__link flow-nav__link--next">
          <span className="flow-nav__dir mono-label">Next</span>
          <span className="flow-nav__label">{next.shortLabel}</span>
        </Link>
      ) : (
        <span className="flow-nav__spacer" />
      )}
    </nav>
  );
}
