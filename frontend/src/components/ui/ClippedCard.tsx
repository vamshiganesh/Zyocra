import type { ReactNode } from "react";
import "./ClippedCard.css";

type Props = {
  children: ReactNode;
  className?: string;
  tone?: "surface" | "dark";
  clip?: "tl" | "br" | "none";
  padded?: boolean;
};

export function ClippedCard({
  children,
  className = "",
  tone = "surface",
  clip = "none",
  padded = true,
}: Props) {
  return (
    <section
      className={[
        "clip-card",
        `clip-card--${tone}`,
        `clip-card--clip-${clip}`,
        padded ? "clip-card--padded" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
