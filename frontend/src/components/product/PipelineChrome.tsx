import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PIPELINE_SCREENS } from "../../config/screens";
import { usePhase1Data } from "../../hooks/usePhase1Data";
import { PipelineStrip } from "./PipelineStrip";
import "./product.css";

const META_HIDDEN_KEY = "zyocra-pipeline-meta-hidden";

export function PipelineChrome() {
  const { pathname } = useLocation();
  const { status, view, reload } = usePhase1Data();
  const stepIndex = PIPELINE_SCREENS.findIndex((screen) => screen.path === pathname);
  const step = stepIndex >= 0 ? PIPELINE_SCREENS[stepIndex] : undefined;
  const nextStep =
    stepIndex >= 0 && stepIndex < PIPELINE_SCREENS.length - 1
      ? PIPELINE_SCREENS[stepIndex + 1]
      : null;
  const [infoOpen, setInfoOpen] = useState(false);
  const [metaHidden, setMetaHidden] = useState(
    () => sessionStorage.getItem(META_HIDDEN_KEY) === "1",
  );
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infoOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!infoRef.current?.contains(event.target as Node)) {
        setInfoOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [infoOpen]);

  const syncedAt = view?.raw.syncedAt
    ? view.raw.syncedAt.replace("T", " ").replace("Z", " UTC").slice(0, 19)
    : null;
  const onChain = view?.raw.hasOnChain ?? false;
  const dataReady = status === "ready" && syncedAt;

  const hideMeta = () => {
    sessionStorage.setItem(META_HIDDEN_KEY, "1");
    setMetaHidden(true);
    setInfoOpen(false);
  };

  return (
    <div className="pipeline-chrome">
      <div className="pipeline-chrome__bar">
        <PipelineStrip compact />
        <div className="pipeline-chrome__tools">
          {step ? (
            <span className="pipeline-chrome__step mono-label">
              {step.pipelineStep}/{PIPELINE_SCREENS.length}
            </span>
          ) : null}
          <span
            className={`pipeline-chrome__dot${dataReady ? " is-live" : ""}`}
            title={dataReady ? "Demo data loaded" : "No demo data"}
            aria-hidden="true"
          />
          <button
            type="button"
            className="pipeline-chrome__icon-btn"
            onClick={() => reload()}
            title="Refresh phase1-demo.json"
            aria-label="Refresh demo data"
          >
            ↻
          </button>
          {nextStep ? (
            <Link to={nextStep.path} className="pipeline-chrome__next">
              {nextStep.shortLabel} →
            </Link>
          ) : step ? (
            <Link to="/benchmarks" className="pipeline-chrome__next">
              Benchmarks →
            </Link>
          ) : null}
          <div className="pipeline-chrome__info-wrap" ref={infoRef}>
            <button
              type="button"
              className={`pipeline-chrome__icon-btn${infoOpen ? " is-active" : ""}`}
              onClick={() => setInfoOpen((open) => !open)}
              aria-expanded={infoOpen}
              aria-label="About this demo"
            >
              ?
            </button>
            {infoOpen ? (
              <div className="pipeline-chrome__popover" role="dialog" aria-label="Demo info">
                <p>
                  Read-only replay of your local EZKL + Foundry pipeline. Nothing here runs
                  proofs or transactions in the browser.
                </p>
                {dataReady ? (
                  <p className="pipeline-chrome__popover-meta">
                    <code>phase1-demo.json</code> · {syncedAt}
                    {onChain ? " · on-chain submission included" : " · off-chain only"}
                  </p>
                ) : (
                  <p className="pipeline-chrome__popover-meta">
                    Run <code>bash scripts/e2e_phase1.sh</code> from the repo root, then
                    refresh.
                  </p>
                )}
                {!metaHidden ? (
                  <button type="button" className="pipeline-chrome__popover-link" onClick={hideMeta}>
                    Hide status line
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {!metaHidden ? (
        <p className="pipeline-chrome__meta mono-label">
          <span>Read-only artifact replay</span>
          <span className="pipeline-chrome__sep" aria-hidden="true">
            ·
          </span>
          {dataReady ? (
            <span>
              synced {syncedAt}
              {onChain ? " · on-chain" : ""}
            </span>
          ) : (
            <span>run e2e_phase1.sh to populate</span>
          )}
        </p>
      ) : null}
    </div>
  );
}
