import {
  OverlayScrollbars,
  ScrollbarsHidingPlugin,
} from "overlayscrollbars";
import type { PartialOptions } from "overlayscrollbars";

OverlayScrollbars.plugin(ScrollbarsHidingPlugin);

const BODY_OPTIONS: PartialOptions = {
  overflow: {
    x: "hidden",
    y: "scroll",
  },
  scrollbars: {
    theme: "os-theme-zyocra",
    autoHide: "never",
    clickScroll: false,
  },
};

const NESTED_OPTIONS: PartialOptions = {
  overflow: {
    x: "scroll",
    y: "scroll",
  },
  scrollbars: {
    theme: "os-theme-zyocra",
    autoHide: "never",
    clickScroll: false,
  },
};

const NESTED_SELECTOR = ".site-rail, .bench-panel__table-wrap";

function ensureInitAttributes(): void {
  document.documentElement.setAttribute("data-overlayscrollbars-initialize", "");
  document.body.setAttribute("data-overlayscrollbars-initialize", "");
}

/** Initialize document scrollbar — replaces native OS scrollbar (incl. Windows arrow buttons). */
export function initDocumentScrollbar(): void {
  ensureInitAttributes();

  if (!OverlayScrollbars(document.body)) {
    OverlayScrollbars(document.body, BODY_OPTIONS);
  }
}

/** Attach overlay scrollbars to nested overflow containers after React paints. */
export function initNestedScrollbars(): void {
  document.querySelectorAll<HTMLElement>(NESTED_SELECTOR).forEach((el) => {
    if (!OverlayScrollbars(el)) {
      OverlayScrollbars(el, NESTED_OPTIONS);
    }
  });
}

export function initScrollbar(): void {
  initDocumentScrollbar();
  initNestedScrollbars();
}
