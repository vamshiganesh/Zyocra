import { Link } from "react-router-dom";
import "./LogoMark.css";

export function LogoMark() {
  return (
    <Link to="/" className="logo-mark" aria-label="Zyocra home">
      <span className="logo-mark__glyph" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
          <path d="M12 3L19 12L12 21L5 12L12 3Z" fill="currentColor" />
        </svg>
      </span>
    </Link>
  );
}
