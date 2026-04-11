import { Link } from "react-router-dom";

export default function Sidebar({ open, onNavigate }) {
  return (
    <nav className={open ? "sidebar sidebar-open" : "sidebar"} aria-label="Main menu">
      <Link className="sidebar-link" to="/" onClick={onNavigate}>
        Home
      </Link>
      <Link className="sidebar-link" to="/staff/login" onClick={onNavigate}>
        Staff Mode
      </Link>
    </nav>
  );
}
