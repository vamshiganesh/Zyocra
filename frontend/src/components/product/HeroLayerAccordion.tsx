import { useState } from "react";
import type { HeroLayer } from "../../data/content";
import { CollapsePanel } from "../ui/CollapsePanel";
import "./HeroLayerAccordion.css";

type Props = {
  items: HeroLayer[];
  defaultOpen?: number;
  onActiveChange?: (id: string) => void;
};

function LayerChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`hero-layers__chevron${open ? " is-open" : ""}`}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 5 L7 9 L11 5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeroLayerAccordion({ items, defaultOpen = 1, onActiveChange }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen);

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
              <LayerChevron open={open} />
            </button>
            <CollapsePanel open={open}>
              <ul className="hero-layers__bullets">
                {item.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </CollapsePanel>
          </div>
        );
      })}
    </div>
  );
}
