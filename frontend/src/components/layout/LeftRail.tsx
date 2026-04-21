import { NavLink, useLocation } from "react-router-dom";
import { screenForPath } from "../../config/screens";
import "./LeftRail.css";

export function LeftRail() {
  const { pathname } = useLocation();
  const screen = screenForPath(pathname);

  return (
    <nav className="left-rail" aria-label="Section">
      <ul className="left-rail__list">
        {screen.sections.map((section) => (
          <li key={section.id}>
            <NavLink
              to={
                screen.path === "/"
                  ? `/#${section.id}`
                  : `${screen.path}#${section.id}`
              }
              className="left-rail__link"
            >
              <span className="left-rail__index">{section.index}</span>
              <span>{section.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
