import { Link } from "react-router-dom";
import type { ProverKind } from "../../types/phase1";
import { ClippedButton } from "../ui/ClippedButton";

type Props = {
  variant?: "accent" | "surface" | "ink" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
  autoRun?: boolean;
  prover?: ProverKind;
};

export function RunEpochDemoButton({
  children,
  variant = "accent",
  size = "md",
  className,
  autoRun = false,
  prover,
}: Props) {
  const params = new URLSearchParams();
  if (autoRun) params.set("run", "epoch");
  if (prover) params.set("prover", prover);
  const query = params.toString();
  const to = query ? `/operator?${query}` : "/operator";

  return (
    <ClippedButton to={to} variant={variant} size={size} className={className}>
      {children}
    </ClippedButton>
  );
}

export function TourPipelineLink({ className }: { className?: string }) {
  return (
    <Link to="/epoch#active" className={className ?? "mono-label"} style={{ color: "var(--color-ink-muted)" }}>
      Tour screens
    </Link>
  );
}
