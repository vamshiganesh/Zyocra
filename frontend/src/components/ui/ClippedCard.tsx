import type { ReactNode } from "react";
import "./ClippedCard.css";

type Props = {
  children: ReactNode;
  className?: string;
  tone?: "surface" | "dark";
  padded?: boolean;
  /** Show technical L-brackets at each corner (Dispatch-style). */
  brackets?: boolean;
};

export function ClippedCard({
  children,
  className = "",
  tone = "surface",
  padded = true,
  brackets = true,
}: Props) {
  return (
    <section
      className={[
        "clip-card",
        `clip-card--${tone}`,
        brackets ? "clip-card--brackets" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {brackets ? (
        <div className="clip-card__brackets" aria-hidden="true">
          <span className="clip-card__bracket clip-card__bracket--tl" />
          <span className="clip-card__bracket clip-card__bracket--tr" />
          <span className="clip-card__bracket clip-card__bracket--br" />
          <span className="clip-card__bracket clip-card__bracket--bl" />
        </div>
      ) : null}
      <div
        className={[
          "clip-card__panel",
          padded ? "clip-card__panel--padded" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="clip-card__panel-fill">{children}</div>
      </div>
    </section>
  );
}
