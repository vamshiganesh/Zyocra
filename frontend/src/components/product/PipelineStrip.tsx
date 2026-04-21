import { NavLink } from "react-router-dom";
import { flowSteps } from "../../data/product-placeholders";
import "./product.css";

type Props = {
  currentPath?: string;
};

export function PipelineStrip({ currentPath }: Props) {
  return (
    <ol className="pipeline-strip">
      {flowSteps.map((step) => (
        <li key={step.path}>
          <NavLink
            to={step.path}
            className={({ isActive }) =>
              `pipeline-strip__step${isActive || step.path === currentPath ? " is-active" : ""}`
            }
          >
            <span className="pipeline-strip__index mono-label">{step.step}</span>
            <span className="pipeline-strip__label">{step.label}</span>
          </NavLink>
        </li>
      ))}
    </ol>
  );
}
