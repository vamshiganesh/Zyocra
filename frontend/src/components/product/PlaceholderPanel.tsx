import type { ReactNode } from "react";
import "./product.css";

type Props = {
  label: string;
  title?: string;
  children: ReactNode;
  status?: "idle" | "ready" | "running" | "verified" | "sealed";
};

const statusLabel: Record<NonNullable<Props["status"]>, string> = {
  idle: "Idle",
  ready: "Ready",
  running: "Running",
  verified: "Verified",
  sealed: "Sealed",
};

export function PlaceholderPanel({ label, title, children, status }: Props) {
  return (
    <div className="ph-panel">
      <div className="ph-panel__head">
        <div>
          <p className="ph-panel__label mono-label">{label}</p>
          {title ? <h3 className="ph-panel__title">{title}</h3> : null}
        </div>
        {status ? (
          <span className={`ph-panel__status ph-panel__status--${status} mono-label`}>
            {statusLabel[status]}
          </span>
        ) : null}
      </div>
      <div className="ph-panel__body">{children}</div>
    </div>
  );
}
