import { benchmarkRows } from "../../data/placeholders";
import { BenchmarkPanel } from "../ui/BenchmarkPanel";
import { SectionHeader } from "../ui/SectionHeader";
import { usePhase1Data } from "../../hooks/usePhase1Data";
import "./product.css";

/** Benchmark comparison slot — populated in Milestone 5; shows live status now. */
export function BenchmarkPlaceholderPanel() {
  const { view } = usePhase1Data();
  const note = view?.raw.benchmark.note ?? "Benchmark rows populate after Milestone 5 runs.";

  return (
    <div className="benchmark-placeholder">
      <SectionHeader
        label="Benchmarks"
        title="EZKL vs Circom (pending)"
        description={note}
      />
      <p className="benchmark-placeholder__status mono-label">
        {view?.raw.benchmark.populated ? "Populated" : "Awaiting benchmark run · rows frozen"}
      </p>
      <BenchmarkPanel rows={benchmarkRows} />
    </div>
  );
}
