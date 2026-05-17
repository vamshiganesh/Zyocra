import { useState } from "react";
import type { HeroLayer } from "../../data/content";
import "./HeroLayerAccordion.css";

type Props = {
  items: HeroLayer[];
  defaultOpen?: number;
  onActiveChange?: (id: string) => void;
};

export function HeroLayerAccordion({ items, defaultOpen = 1, onActiveChange }: Props) {
  const [openIndex, setOpenIndex] = useState(defaultOpen);

  const toggle = (index: number) => {
    const next = openIndex === index ? null : index;
    setOpenIndex(next);
    if (next !== null) {
      onActiveChange?.(items[next].id);
    }
  };

  return (
    <div className="hero-layers">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div
            key={item.id}
            className={`hero-layers__item${open ? " is-open" : ""}`}
          >
            <button
              type="button"
              className="hero-layers__trigger"
              aria-expanded={open}
              onClick={() => toggle(index)}
            >
              <span className="hero-layers__title">
                <span className="hero-layers__index mono-label">{item.index}</span>
                {item.title}
              </span>
              <span className="hero-layers__chevron" aria-hidden="true">
                {open ? "⌃" : "⌄"}
              </span>
            </button>
            {open ? (
              <ul className="hero-layers__bullets">
                {item.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
