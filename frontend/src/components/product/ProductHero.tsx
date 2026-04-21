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
  return (
    <div className="hero">
      <div>
        <p className="hero__eyebrow mono-label label-dot">{eyebrow}</p>
        <h1 className="hero__title">{title}</h1>
        <p className="hero__body">{body}</p>
        {actions ? <div className="hero__actions">{actions}</div> : null}
      </div>
      {aside ? <div className="hero__aside hatch-dark">{aside}</div> : null}
    </div>
  );
}
