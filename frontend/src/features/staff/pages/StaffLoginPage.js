import React from "react";
import { useNavigate } from "react-router-dom";

export default function StaffLoginPage() {
  const navigate = useNavigate();

  return (
    <div className="staff-login-screen">
      <header className="staff-topbar">
        <button type="button" onClick={() => navigate(-1)} aria-label="Go back">←</button>
        <h1>Staff Login</h1>
      </header>

      <main className="staff-login-body">
        <form className="staff-login-card">
          <div className="lock-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M7 10V7a5 5 0 0 1 10 0v3" />
              <rect x="5" y="10" width="14" height="10" rx="2" />
            </svg>
          </div>

          <h2>Welcome Back</h2>
          <p>Login to access staff dashboard</p>

          <label>
            <span>Mobile Number</span>
            <div className="staff-input-wrap">
              <span aria-hidden="true">⌕</span>
              <input type="tel" placeholder="Enter mobile number" />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="staff-input-wrap">
              <span aria-hidden="true">▢</span>
              <input type="password" placeholder="Enter password" />
            </div>
          </label>

          <button className="staff-login-button" type="submit">Login</button>
        </form>
      </main>
    </div>
  );
}
