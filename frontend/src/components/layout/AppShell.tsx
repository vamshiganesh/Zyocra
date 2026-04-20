import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { initNestedScrollbars } from "../../scrollbar/initScrollbar";
import { LeftRail } from "./LeftRail";
import { LogoMark } from "./LogoMark";
import { SiteFooter } from "./SiteFooter";
import { TopNav } from "./TopNav";

export function AppShell() {
  const location = useLocation();

  useEffect(() => {
    requestAnimationFrame(() => {
      initNestedScrollbars();
    });
  }, [location.pathname]);

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
