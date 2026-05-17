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
};

export function BenchmarkPanel({
  title = "Benchmark headline",
  rows,
  note = "Placeholder metrics, filled in Milestone 5.",
}: Props) {
  return (
    <div className="bench-panel">
      <div className="bench-panel__head">
        <p className="mono-label label-dot">{title}</p>
        <p className="bench-panel__note">{note}</p>
      </div>
      <div className="bench-panel__table-wrap" data-lenis-prevent>
        <table className="bench-panel__table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>EZKL baseline</th>
              <th>Custom Circom</th>
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
