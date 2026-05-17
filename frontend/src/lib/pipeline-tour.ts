import type { NavigateFunction } from "react-router-dom";

export const PIPELINE_TOUR_KEY = "zyocra-pipeline-tour";
export const PIPELINE_START_PATH = "/epoch";
export const PIPELINE_START_HASH = "#active";

export function isPipelineTourActive(): boolean {
  return sessionStorage.getItem(PIPELINE_TOUR_KEY) === "1";
}

import { scrollToElement } from "../scrollbar/smoothScroll";

export function scrollToSection(hash: string) {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  requestAnimationFrame(() => {
    scrollToElement(id);
  });
}

/** Start the six-screen pipeline walk. Does not run EZKL — navigates + scrolls only. */
export function startPipelineTour(navigate: NavigateFunction, pathname: string) {
  sessionStorage.setItem(PIPELINE_TOUR_KEY, "1");
  window.dispatchEvent(new CustomEvent("zyocra:pipeline-tour"));

  if (pathname === PIPELINE_START_PATH) {
    scrollToSection(PIPELINE_START_HASH);
    return;
  }

  navigate(`${PIPELINE_START_PATH}${PIPELINE_START_HASH}`, { state: { pipelineTour: true } });
}
