import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Include left rail spacer column (aligns with fixed section nav). */
  withRail?: boolean;
};

/** Centered content frame with vertical edge rules. */
export function Shell({ children, withRail = true }: Props) {
  if (!withRail) {
    return <div className="shell">{children}</div>;
  }

  return (
    <div className="shell shell--split">
      <div className="shell__rail-slot" aria-hidden="true" />
      <div className="shell__main">{children}</div>
    </div>
  );
}
