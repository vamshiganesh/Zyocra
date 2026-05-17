import { NavLink } from "react-router-dom";
import { PipelineStartButton } from "../product/PipelineStartButton";
import "./TopNav.css";

const links = [
  { to: "/", label: "Overview", end: true },
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
      <PipelineStartButton variant="accent" size="sm">
        Walk pipeline
      </PipelineStartButton>
    </nav>
  );
}
