import type { ReactNode } from "react";
import "./StatTile.css";

type Props = {
  label: string;
  value: string;
  detail?: string;
  accent?: boolean;
  icon?: ReactNode;
};

function DefaultIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1.5L12 7L7 12.5L2 7L7 1.5Z" stroke="currentColor" strokeWidth="1" />
      <path d="M7 4L9.2 7L7 10L4.8 7L7 4Z" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function StatTile({
  label,
  value,
  detail,
  accent = false,
  icon,
}: Props) {
  return (
    <article className={`stat-tile${accent ? " stat-tile--accent" : ""}`}>
      <div className="stat-tile__top">
        <p className="stat-tile__label">{label}</p>
        <span className="stat-tile__icon">{icon ?? <DefaultIcon />}</span>
      </div>
      <p className="stat-tile__value">{value}</p>
      {detail ? <p className="stat-tile__detail">{detail}</p> : null}
    </article>
  );
}
