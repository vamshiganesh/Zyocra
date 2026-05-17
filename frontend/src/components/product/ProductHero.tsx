import type { ReactNode } from "react";
import "./product.css";

type HeroProps = {
  eyebrow: string;
  title: string;
  body: string;
  actions?: ReactNode;
  aside?: ReactNode;
};

export function ProductHero({ eyebrow, title, body, actions, aside }: HeroProps) {
  const titleLines = title.split("\n");

  return (
    <div className="hero">
      <div className="hero__copy">
        <p className="hero__eyebrow mono-label label-dot">{eyebrow}</p>
        <h1 className="hero__title">
          {titleLines.map((line, index) => (
            <span key={line}>
              {index > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </h1>
        <p className="hero__body">{body}</p>
        {actions ? <div className="hero__actions">{actions}</div> : null}
      </div>
      {aside ? <div className="hero__aside">{aside}</div> : null}
    </div>
  );
}
