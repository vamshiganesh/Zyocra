import { NavLink } from "react-router-dom";
import { ConnectButton } from "../wallet/ConnectButton";
import { RunEpochDemoButton } from "../product/RunEpochDemoButton";
import "./TopNav.css";

const links = [
  { to: "/", label: "Overview", end: true },
  { to: "/operator", label: "Operator" },
  { to: "/epoch", label: "Epoch" },
  { to: "/benchmarks", label: "Benchmarks" },
  { to: "/threat-model", label: "Threat model" },
  { to: "/updates", label: "Updates" },
];

export function TopNav() {
  return (
    <nav className="top-nav" aria-label="Primary">
      <div className="top-nav__links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `top-nav__link${isActive ? " is-active" : ""}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
      <div className="top-nav__actions">
        <ConnectButton />
        <RunEpochDemoButton variant="accent" size="sm" autoRun>
          Run epoch demo
        </RunEpochDemoButton>
      </div>
    </nav>
  );
}
