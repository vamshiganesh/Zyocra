import type { DataField } from "../../data/product-placeholders";
import "./product.css";

type Props = {
  fields: DataField[];
  columns?: 2 | 3;
};

export function DataFieldGrid({ fields, columns = 2 }: Props) {
  return (
    <dl className={`data-grid data-grid--${columns}`}>
      {fields.map((field) => (
        <div key={field.label} className="data-grid__item">
          <dt className="data-grid__label mono-label">{field.label}</dt>
          {field.description ? (
            <dd className="data-grid__desc">{field.description}</dd>
          ) : null}
          <dd
            className={`data-grid__value${field.mono ? " data-grid__value--mono" : ""}`}
          >
            {field.value}
          </dd>
          {field.hint ? <dd className="data-grid__hint">{field.hint}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
