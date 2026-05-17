import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PIPELINE_SCREENS } from "../../config/screens";
import { isPipelineTourActive } from "../../lib/pipeline-tour";
import { usePhase1Data } from "../../hooks/usePhase1Data";
import "./product.css";

export function DemoModeBanner() {
  const { pathname } = useLocation();
  const { status, view, reload } = usePhase1Data();
  const step = PIPELINE_SCREENS.find((screen) => screen.path === pathname);
  const [visible, setVisible] = useState(() => isPipelineTourActive() || step !== undefined);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const onTour = () => {
      setVisible(true);
      setPulse(true);
      window.setTimeout(() => setPulse(false), 1200);
    };
    window.addEventListener("zyocra:pipeline-tour", onTour);
    return () => window.removeEventListener("zyocra:pipeline-tour", onTour);
  }, []);

  if (!visible) return null;

  const syncedAt = view?.raw.syncedAt
    ? view.raw.syncedAt.replace("T", " ").replace("Z", " UTC")
    : null;
  const onChain = view?.raw.hasOnChain ?? false;

  return (
    <aside
      className={`demo-banner${pulse ? " demo-banner--pulse" : ""}`}
      aria-label="How this demo works"
    >
      <div className="demo-banner__copy">
        <p className="demo-banner__title mono-label">
          {step
            ? `Step ${step.pipelineStep} / ${PIPELINE_SCREENS.length} · ${step.shortLabel}`
            : "Pipeline demo"}
        </p>
        <p className="demo-banner__body">
          <strong>Read-only artifact browser.</strong> This UI replays outputs from your
          terminal pipeline (EZKL prove, Foundry deploy, optional Anvil submit). Nothing
          here runs proofs or transactions in the browser.
        </p>
        {status === "ready" && syncedAt ? (
          <p className="demo-banner__meta">
            Loaded <code>phase1-demo.json</code> · synced {syncedAt}
            {onChain ? " · includes on-chain submission" : " · off-chain proof only"}
          </p>
        ) : (
          <p className="demo-banner__meta">
            Generate data from repo root:{" "}
            <code>bash scripts/e2e_phase1.sh</code> then refresh below.
          </p>
        )}
      </div>
      <div className="demo-banner__actions">
        <button type="button" className="demo-banner__btn" onClick={() => reload()}>
          Refresh data
        </button>
        {step && step.pipelineStep < PIPELINE_SCREENS.length ? (
          <Link
            to={PIPELINE_SCREENS[step.pipelineStep].path}
            className="demo-banner__link"
          >
            Next step →
          </Link>
        ) : step ? (
          <Link to="/benchmarks" className="demo-banner__link">
            Compare benchmarks →
          </Link>
        ) : (
          <Link to="/epoch#active" className="demo-banner__link">
            Open epoch →
          </Link>
        )}
        <button
          type="button"
          className="demo-banner__dismiss"
          onClick={() => setVisible(false)}
          aria-label="Dismiss demo banner"
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
}
