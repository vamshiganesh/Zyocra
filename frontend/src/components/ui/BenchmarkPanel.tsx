import "./BenchmarkPanel.css";

export type BenchmarkRow = {
  metric: string;
  ezkl: string;
  circom: string;
};

type Props = {
  title?: string;
  rows: BenchmarkRow[];
  note?: string;
  ezklColumn?: string;
  circomColumn?: string;
  banner?: string;
  bannerTone?: "warn" | "ok";
};

export function BenchmarkPanel({
  title = "Matched head subgraph",
  rows,
  note = "Same hidden[8] → logit workload on both paths.",
  ezklColumn = "EZKL head",
  circomColumn = "Circom head",
  banner,
  bannerTone = "warn",
}: Props) {
  return (
    <div className="bench-panel">
      <div className="bench-panel__head">
        <p className="mono-label label-dot">{title}</p>
        <p className="bench-panel__note">{note}</p>
      </div>
      {banner ? (
        <p
          className={`bench-panel__banner${bannerTone === "warn" ? " bench-panel__banner--warn" : ""}`}
          role="note"
        >
          {banner}
        </p>
      ) : null}
      <div className="bench-panel__table-wrap" data-lenis-prevent>
        <table className="bench-panel__table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>{ezklColumn}</th>
              <th>{circomColumn}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.metric}>
                <td>{row.metric}</td>
                <td>{row.ezkl}</td>
                <td>{row.circom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
