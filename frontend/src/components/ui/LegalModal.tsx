import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import type { LegalSection } from "../../data/content";
import { privacyCopy, termsCopy } from "../../data/content";
import { ClippedCard } from "./ClippedCard";
import { SectionHeader } from "./SectionHeader";
import "./LegalModal.css";

export type LegalKind = "terms" | "privacy";

type Props = {
  kind: LegalKind;
  onClose: () => void;
};

function LegalBody({ sections }: { sections: LegalSection[] }) {
  return (
    <div className="legal-modal__body prose-list">
      {sections.map((section) => (
        <article key={section.title} className="prose-list__item">
          <h3>{section.title}</h3>
          <p>{section.body}</p>
        </article>
      ))}
    </div>
  );
}

export function LegalModal({ kind, onClose }: Props) {
  const titleId = useId();
  const copy = kind === "terms" ? termsCopy : privacyCopy;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="legal-modal" role="presentation" onClick={onClose}>
      <div
        className="legal-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <ClippedCard className="legal-modal__card">
          <div className="legal-modal__header">
            <SectionHeader
              label={copy.eyebrow}
              title={copy.title}
              description={`${copy.lede} ${copy.updated}`}
            />
            <button
              type="button"
              className="legal-modal__close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <h2 id={titleId} className="legal-modal__sr-only">
            {copy.title}
          </h2>
          <LegalBody sections={copy.sections} />
        </ClippedCard>
      </div>
    </div>,
    document.body,
  );
}
