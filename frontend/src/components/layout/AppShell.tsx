import { Outlet } from "react-router-dom";
import { LeftRail } from "./LeftRail";
import { LogoMark } from "./LogoMark";
import { SiteFooter } from "./SiteFooter";
import { TopNav } from "./TopNav";

export function AppShell() {
  return (
    <div className="app-frame">
      <div className="app-shell">
        <div className="app-shell__logo">
          <LogoMark />
        </div>
        <div className="app-shell__topnav">
          <TopNav />
        </div>
        <aside className="app-shell__rail">
          <LeftRail />
        </aside>
        <main className="app-shell__main" id="main-scroll">
          <div id="top" tabIndex={-1} />
          <Outlet />
          <SiteFooter />
        </main>
      </div>
    </div>
  );
}
