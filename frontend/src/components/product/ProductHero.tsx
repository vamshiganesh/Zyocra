import type { ReactNode } from "react";
import type { HeroLayer } from "../../data/content";
import { HeroLayerAccordion } from "./HeroLayerAccordion";

type HeroProps = {
  eyebrow: string;
  title: string;
  body: string;
  actions?: ReactNode;
  layers?: HeroLayer[];
  defaultLayerOpen?: number;
  onLayerChange?: (id: string) => void;
  aside?: ReactNode;
};

export function ProductHero({
  eyebrow,
  title,
  body,
  actions,
  layers,
  defaultLayerOpen = 1,
  onLayerChange,
  aside,
}: HeroProps) {
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
        {layers ? (
          <HeroLayerAccordion
            items={layers}
            defaultOpen={defaultLayerOpen}
            onActiveChange={onLayerChange}
          />
        ) : null}
      </div>
      {aside ? <div className="hero__aside hero__aside--diagram">{aside}</div> : null}
    </div>
  );
}
