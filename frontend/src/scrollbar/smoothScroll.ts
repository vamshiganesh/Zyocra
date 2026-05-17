import Lenis from "lenis";
import { OverlayScrollbars } from "overlayscrollbars";

/**
 * Framer / Lenis defaults — responsive without the lag of ultra-low lerp values.
 * @see https://github.com/darkroomengineering/lenis#settings
 */
export const LENIS_CONFIG = {
  lerp: 0.1,
  wheelMultiplier: 1,
  touchMultiplier: 1,
  smoothWheel: true,
  syncTouch: false,
  autoRaf: true,
  autoResize: true,
  stopInertiaOnNavigate: true,
} as const;

const NESTED_SCROLL_SELECTOR =
  ".site-rail, .bench-panel__table-wrap, [data-scroll-lock], [data-lenis-prevent]";

let lenis: Lenis | null = null;

function shouldUseNativeScroll(node: HTMLElement): boolean {
  return Boolean(node.closest(NESTED_SCROLL_SELECTOR));
}

/** Initialize Lenis on the OverlayScrollbars document viewport. */
export function initSmoothScroll(): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  const instance = OverlayScrollbars(document.body);
  const { viewport, content } = instance?.elements() ?? {};

  lenis = new Lenis({
    ...LENIS_CONFIG,
    wrapper: viewport ?? window,
    content: content ?? document.documentElement,
    prevent: (node) => shouldUseNativeScroll(node),
  });

  return () => {
    lenis?.destroy();
    lenis = null;
  };
}

export function getLenis(): Lenis | null {
  return lenis;
}

export function scrollToTop(immediate = false): void {
  if (lenis) {
    lenis.scrollTo(0, { immediate });
    return;
  }

  window.scrollTo({ top: 0, left: 0, behavior: immediate ? "auto" : "smooth" });
}

export function scrollToElement(id: string, immediate = false): void {
  const element = document.getElementById(id);
  if (!element) return;

  if (lenis) {
    lenis.scrollTo(element, { immediate, lerp: LENIS_CONFIG.lerp });
    return;
  }

  element.scrollIntoView({ behavior: immediate ? "auto" : "smooth", block: "start" });
}

export function refreshSmoothScroll(): void {
  lenis?.resize();
}
