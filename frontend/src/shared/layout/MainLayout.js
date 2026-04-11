import React from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "./Sidebar";

export default function MainLayout({ children }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();
  const isStaffLogin = location.pathname === "/staff/login";

  const toggleMenu = () => setMenuOpen((current) => !current);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={isStaffLogin ? "app-layout staff-layout" : "app-layout"}>
      {!isStaffLogin && <Header menuOpen={menuOpen} onMenuToggle={toggleMenu} />}
      {!isStaffLogin && <Sidebar open={menuOpen} onNavigate={closeMenu} />}
      {!isStaffLogin && menuOpen && (
        <button
          className="menu-backdrop"
          type="button"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      )}

      <main className={isStaffLogin ? "page-content staff-page-content" : "page-content"}>{children}</main>
    </div>
  );
}
