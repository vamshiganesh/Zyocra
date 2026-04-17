import { NavLink, useLocation } from "react-router-dom";
import "./LeftRail.css";

const homeSections = [
  { id: "capabilities", label: "Capabilities", index: "01" },
  { id: "numbers", label: "Numbers", index: "02" },
  { id: "features", label: "Features", index: "03" },
  { id: "benchmarks", label: "Benchmarks", index: "04" },
  { id: "pricing", label: "Pricing", index: "05" },
  { id: "faq", label: "FAQ", index: "06" },
];

const aboutSections = [
  { id: "values", label: "Values", index: "01" },
  { id: "team", label: "Team", index: "02" },
  { id: "careers", label: "Careers", index: "03" },
];

const updatesSections = [
  { id: "changelog", label: "Changelog", index: "01" },
];

const blogSections = [
  { id: "insights", label: "Insights", index: "01" },
];

function sectionsForPath(pathname: string) {
  if (pathname.startsWith("/about")) return aboutSections;
  if (pathname.startsWith("/updates")) return updatesSections;
  if (pathname.startsWith("/blog")) return blogSections;
  return homeSections;
}

export function LeftRail() {
  const { pathname } = useLocation();
  const sections = sectionsForPath(pathname);
  const base = pathname.startsWith("/about")
    ? "/about"
    : pathname.startsWith("/updates")
      ? "/updates"
      : pathname.startsWith("/blog")
        ? "/blog"
        : "/";

  return (
    <nav className="left-rail" aria-label="Section">
      <ul className="left-rail__list">
        {sections.map((section) => (
          <li key={section.id}>
            <NavLink
              to={`${base}#${section.id}`}
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
