import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { startPipelineTour } from "../../lib/pipeline-tour";
import { ClippedButton } from "../ui/ClippedButton";

type Props = {
  children: ReactNode;
  variant?: "accent" | "surface" | "ink" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function PipelineStartButton({
  children,
  variant = "accent",
  size = "md",
  className,
}: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <ClippedButton
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => startPipelineTour(navigate, pathname)}
    >
      {children}
    </ClippedButton>
  );
}
