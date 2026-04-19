import type { ReactNode } from "react";
import "../../styles/blueprint.css";

type Props = {
  cols?: 2 | 3;
  children: ReactNode;
  className?: string;
};

/** Hairline grid with diamond marks at column intersections. */
export function BlueprintGrid({ cols = 3, children, className = "" }: Props) {
  const marks =
    cols === 3
      ? (["v1", "v2"] as const)
      : (["v1"] as const);

  return (
    <div className={`blueprint blueprint--cols-${cols} ${className}`.trim()}>
      <div className="blueprint__marks" aria-hidden="true">
        {marks.map((v) => (
          <span key={`${v}-t`} className={`blueprint__mark blueprint__mark--${v} blueprint__mark--top`} />
        ))}
        {marks.map((v) => (
          <span key={`${v}-b`} className={`blueprint__mark blueprint__mark--${v} blueprint__mark--bottom`} />
        ))}
        {cols === 2 ? (
          <span className="blueprint__mark blueprint__mark--v1 blueprint__mark--mid" />
        ) : (
          <>
            <span className="blueprint__mark blueprint__mark--v1 blueprint__mark--mid" />
            <span className="blueprint__mark blueprint__mark--v2 blueprint__mark--mid" />
          </>
        )}
      </div>
      {children}
    </div>
  );
}

export function BlueprintCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`blueprint__cell ${className}`.trim()}>{children}</div>
  );
}
