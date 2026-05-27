import { Link } from "react-router-dom";
import { ClippedButton } from "../ui/ClippedButton";

type Props = {
  variant?: "accent" | "surface" | "ink" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
  autoRun?: boolean;
};

export function RunEpochDemoButton({
  children,
  variant = "accent",
  size = "md",
  className,
  autoRun = false,
}: Props) {
  const to = autoRun ? "/operator?run=epoch" : "/operator";

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
