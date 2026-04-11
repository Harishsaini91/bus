import React from "react";
import { Link } from "react-router-dom";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="header-icon">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function StaffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="header-icon">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.7-3 2.7-5 5.5-5 1.5 0 2.8.5 3.8 1.5" />
      <circle cx="17" cy="17" r="2" />
      <path d="M17 13.5v1M17 19.5v1M20.5 17h-1M14.5 17h-1M19.5 14.5l-.7.7M15.2 18.8l-.7.7M19.5 19.5l-.7-.7M15.2 15.2l-.7-.7" />
    </svg>
  );
}

export default function Header({ menuOpen, onMenuToggle }) {
  return (
    <header className="header">
      <button
        className="header-action"
        type="button"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={onMenuToggle}
      >
        <MenuIcon />
      </button>
      <div className="menu">☰</div>
      <Link className="title" to="/" onClick={menuOpen ? onMenuToggle : undefined}>Bus Tracking</Link>
      <div className="profile">⚙️</div>
      <Link className="header-action" to="/staff/login" aria-label="Staff login">
        <StaffIcon />
      </Link>
    </header>
  );
}
