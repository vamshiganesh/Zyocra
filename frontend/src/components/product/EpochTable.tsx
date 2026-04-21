import type { EpochRow } from "../../data/product-placeholders";
import "./product.css";

type Props = {
  rows: EpochRow[];
};

export function EpochTable({ rows }: Props) {
  return (
    <div className="epoch-table-wrap">
      <table className="epoch-table">
        <thead>
          <tr>
            <th>Epoch</th>
            <th>Status</th>
            <th>Model</th>
            <th>Adapter</th>
            <th>Verifier</th>
            <th>Scored</th>
            <th>Borrowers</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="epoch-table__id">{row.id}</td>
              <td>
                <span className={`epoch-table__status epoch-table__status--${row.status}`}>
                  {row.status}
                </span>
              </td>
              <td className="epoch-table__mono">{row.modelHash}</td>
              <td className="epoch-table__mono">{row.adapterHash}</td>
              <td>{row.verifier}</td>
              <td>{row.scoredAt}</td>
              <td>{row.borrowers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
