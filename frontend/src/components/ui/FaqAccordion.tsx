import { useState } from "react";
import { CollapsePanel } from "./CollapsePanel";
import "./FaqAccordion.css";

export type FaqItem = {
  question: string;
  answer: string;
};

type Props = {
  items: FaqItem[];
};

export function FaqAccordion({ items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="faq">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.question} className={`faq__item${open ? " is-open" : ""}`}>
            <button
              type="button"
              className="faq__trigger"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : index)}
            >
              <span>{item.question}</span>
              <span className="faq__icon" aria-hidden="true">
                <span className="faq__icon-bar faq__icon-bar--vertical" />
                <span className="faq__icon-bar faq__icon-bar--horizontal" />
              </span>
            </button>
            <CollapsePanel open={open}>
              <p className="faq__answer">{item.answer}</p>
            </CollapsePanel>
          </div>
        );
      })}
    </div>
  );
}
