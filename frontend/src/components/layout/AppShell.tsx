import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PipelineChrome } from "../product/PipelineChrome";
import { PIPELINE_SCREENS } from "../../config/screens";
import { scrollToSection } from "../../lib/pipeline-tour";
import { initNestedScrollbars } from "../../scrollbar/initScrollbar";
import { LeftRail } from "./LeftRail";
import { LogoMark } from "./LogoMark";
import { SiteFooter } from "./SiteFooter";
import { TopNav } from "./TopNav";

export function AppShell() {
  const location = useLocation();
  const pipelineScreen = PIPELINE_SCREENS.find((screen) => screen.path === location.pathname);

  useEffect(() => {
    requestAnimationFrame(() => {
      initNestedScrollbars();
    });
  }, [location.pathname]);

  useEffect(() => {
    if (location.hash) {
      scrollToSection(location.hash);
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.getElementById("top")?.focus({ preventScroll: true });
  }, [location.pathname, location.hash]);

  return (
    <>
      <header className="band band--header">
        <div className="shell shell--header">
          <div className="shell__logo">
            <LogoMark />
          </div>
          <div className="shell__topnav">
            <TopNav />
          </div>
        </div>
      </header>

      {pipelineScreen ? (
        <div className="band band--pipeline">
          <div className="shell shell--split">
            <div className="shell__rail-slot" aria-hidden="true" />
            <div className="shell__main band--pipeline__main">
              <PipelineChrome />
            </div>
          </div>
        </div>
      ) : null}

      <aside className="site-rail" aria-label="Section">
        <LeftRail />
      </aside>

      <main className="site-main">
        <div id="top" tabIndex={-1} />
        <Outlet />
        <SiteFooter />
      </main>
    </>
  );
}
