import { Outlet } from "react-router-dom";
import { LeftRail } from "./LeftRail";
import { LogoMark } from "./LogoMark";
import { TopNav } from "./TopNav";

export function AppShell() {
  return (
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
      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
