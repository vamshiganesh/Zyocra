import type { ReactNode } from "react";
import "./CollapsePanel.css";

type Props = {
  open: boolean;
  children: ReactNode;
  className?: string;
};

/** Height-animated panel, grid 0fr/1fr slide without measuring DOM. */
export function CollapsePanel({ open, children, className }: Props) {
  return (
    <div className={`collapse-panel${open ? " is-open" : ""}${className ? ` ${className}` : ""}`}>
      <div className="collapse-panel__inner">{children}</div>
    </div>
  );
}
