import { NavLink } from "react-router-dom";
import { ClippedButton } from "../ui/ClippedButton";
import "./TopNav.css";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/updates", label: "Updates" },
  { to: "/blog", label: "Blog" },
];

export function TopNav() {
  return (
    <nav className="top-nav" aria-label="Primary">
      <div className="top-nav__links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `top-nav__link${isActive ? " is-active" : ""}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
      <ClippedButton to="/#get-started" variant="accent" clip="bl">
        Get Started
      </ClippedButton>
    </nav>
  );
}
