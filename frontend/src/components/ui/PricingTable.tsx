import { ClippedButton } from "./ClippedButton";
import "./PricingTable.css";

export type PricingPlan = {
  name: string;
  price: string;
  period?: string;
  description: string;
  cta: string;
  featured?: boolean;
  features: Array<{ label: string; included: boolean | string }>;
};

type Props = {
  plans: PricingPlan[];
};

export function PricingTable({ plans }: Props) {
  return (
    <div className="pricing">
      <div className="pricing__grid">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`pricing__plan${plan.featured ? " is-featured" : ""}`}
          >
            <p className="pricing__name mono-label">{plan.name}</p>
            <div className="pricing__price-row">
              <p className="pricing__price">{plan.price}</p>
              {plan.period ? (
                <span className="pricing__period">{plan.period}</span>
              ) : null}
            </div>
            <p className="pricing__desc">{plan.description}</p>
            <ClippedButton
              variant={plan.featured ? "ink" : "surface"}
              clip="br"
              className="pricing__cta"
            >
              {plan.cta}
            </ClippedButton>
            <ul className="pricing__features">
              {plan.features.map((feature) => (
                <li key={feature.label}>
                  <span>{feature.label}</span>
                  <span className="pricing__value">
                    {feature.included === true
                      ? "✓"
                      : feature.included === false
                        ? "—"
                        : feature.included}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
