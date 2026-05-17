import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { BenchmarkDataProvider } from "./hooks/useBenchmarkData";
import { Phase1DataProvider } from "./hooks/usePhase1Data";
import { BenchmarkComparisonPage } from "./pages/BenchmarkComparisonPage";
import { EpochExplorerPage } from "./pages/EpochExplorerPage";
import { InputSummaryPage } from "./pages/InputSummaryPage";
import { OverviewPage } from "./pages/OverviewPage";
import { ProofGenerationPage } from "./pages/ProofGenerationPage";
import { ProofVerificationPage } from "./pages/ProofVerificationPage";
import { ProtocolImpactPage } from "./pages/ProtocolImpactPage";
import { RiskScorePage } from "./pages/RiskScorePage";
import { ThreatModelPage } from "./pages/ThreatModelPage";
import { UpdatesPage } from "./pages/UpdatesPage";

export default function App() {
  return (
    <BrowserRouter>
      <Phase1DataProvider>
        <BenchmarkDataProvider>
        <Routes>
          <Route element={<AppShell />}>
          <Route index element={<OverviewPage />} />
          <Route path="epoch" element={<EpochExplorerPage />} />
          <Route path="inputs" element={<InputSummaryPage />} />
          <Route path="prove" element={<ProofGenerationPage />} />
          <Route path="verify" element={<ProofVerificationPage />} />
          <Route path="score" element={<RiskScorePage />} />
          <Route path="impact" element={<ProtocolImpactPage />} />
          <Route path="benchmarks" element={<BenchmarkComparisonPage />} />
          <Route path="threat-model" element={<ThreatModelPage />} />
          <Route path="updates" element={<UpdatesPage />} />
          {/* Legacy marketing routes */}
          <Route path="about" element={<Navigate to="/threat-model" replace />} />
          <Route path="blog" element={<Navigate to="/updates" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        </Routes>
        </BenchmarkDataProvider>
      </Phase1DataProvider>
    </BrowserRouter>
  );
}
