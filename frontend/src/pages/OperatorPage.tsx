import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Shell } from "../components/layout/Shell";
import { OperatorPanel } from "../components/product/OperatorPanel";
import { ClippedCard } from "../components/ui/ClippedCard";
import { useOperatorJobs } from "../hooks/useOperatorJobs";
import "./pages.css";

export function OperatorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { runJob, busy } = useOperatorJobs();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("run") === "epoch" && !busy) {
      void runJob("run_full_epoch");
      navigate("/operator", { replace: true });
    }
  }, [location.search, runJob, busy, navigate]);

  return (
    <div className="page">
      <section className="band band--panels">
        <Shell>
          <ClippedCard>
            <OperatorPanel />
          </ClippedCard>
        </Shell>
      </section>
    </div>
  );
}
