import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PIPELINE_SCREENS } from "../../config/screens";
import { usePhase1Data } from "../../hooks/usePhase1Data";
import { listJobs } from "../../lib/operator";
import { PipelineStrip } from "./PipelineStrip";
import "./product.css";

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
  const [jobBusy, setJobBusy] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const jobs = await listJobs();
        setJobBusy(jobs.some((job) => job.status === "queued" || job.status === "running"));
      } catch {
        setJobBusy(false);
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 4000);
    return () => window.clearInterval(timer);
  }, []);

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
          {jobBusy ? (
            <Link to="/operator" className="pipeline-chrome__job-chip mono-label">
              Job running
            </Link>
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
                  Operator dashboard runs prove, deploy, and benchmark jobs via the local FastAPI
                  service. Use <strong>Run epoch demo</strong> on the Operator page.
                </p>
                {dataReady ? (
                  <p className="pipeline-chrome__popover-meta">
                    <code>phase1-demo.json</code> · synced {syncedAt}
                    {onChain ? " · on-chain submission included" : " · off-chain only"}
                  </p>
                ) : (
                  <p className="pipeline-chrome__popover-meta">
                    Run <code>bash scripts/e2e_phase1.sh</code> from the repo root, then
                    refresh.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
