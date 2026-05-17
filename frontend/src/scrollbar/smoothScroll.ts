import { OverlayScrollbars } from "overlayscrollbars";

const NESTED_SCROLL_SELECTOR = ".site-rail, .bench-panel__table-wrap, [data-scroll-lock]";
const EASE = 0.11;
const WHEEL_SCALE = 1;

function isNestedScrollable(target: EventTarget | null, viewport: HTMLElement): boolean {
  if (!(target instanceof Element)) return false;

  let node: Element | null = target;
  while (node && node !== viewport) {
    if (node instanceof HTMLElement) {
      if (node.matches(NESTED_SCROLL_SELECTOR)) return true;
      const { overflowY } = getComputedStyle(node);
      if (
        (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
        node.scrollHeight > node.clientHeight + 1
      ) {
        return true;
      }
    }
    node = node.parentElement;
  }

  return false;
}

/** Slight wheel inertia on the document viewport (pairs with OverlayScrollbars). */
export function initSmoothScroll(): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  const instance = OverlayScrollbars(document.body);
  const viewport = instance?.elements().viewport;
  if (!viewport) return () => {};

  let target = viewport.scrollTop;
  let current = target;
  let raf: number | null = null;

  const tick = () => {
    const delta = target - current;
    if (Math.abs(delta) < 0.5) {
      current = target;
      viewport.scrollTop = current;
      raf = null;
      return;
    }

    current += delta * EASE;
    viewport.scrollTop = current;
    raf = requestAnimationFrame(tick);
  };

  const queue = () => {
    if (raf === null) raf = requestAnimationFrame(tick);
  };

  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) return;
    if (isNestedScrollable(event.target, viewport)) return;

    event.preventDefault();

    const max = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    target = Math.max(0, Math.min(max, target + event.deltaY * WHEEL_SCALE));
    queue();
  };

  const onScroll = () => {
    if (raf !== null) return;
    target = viewport.scrollTop;
    current = viewport.scrollTop;
  };

  viewport.addEventListener("wheel", onWheel, { passive: false });
  viewport.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    viewport.removeEventListener("wheel", onWheel);
    viewport.removeEventListener("scroll", onScroll);
    if (raf !== null) cancelAnimationFrame(raf);
  };
}
