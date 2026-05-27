import { Shell } from "../components/layout/Shell";
import { OperatorPanel } from "../components/product/OperatorPanel";
import { ClippedCard } from "../components/ui/ClippedCard";
import "./pages.css";

export function OperatorPage() {
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
