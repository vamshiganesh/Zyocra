import type { ReactNode } from "react";
import "./StatTile.css";

type Props = {
  label: string;
  value: string;
  detail?: string;
  accent?: boolean;
  icon?: ReactNode;
};

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
        <p className="stat-tile__label mono-label">{label}</p>
        {icon ? <span className="stat-tile__icon">{icon}</span> : null}
      </div>
      <p className="stat-tile__value">{value}</p>
      {detail ? <p className="stat-tile__detail">{detail}</p> : null}
    </article>
  );
}
