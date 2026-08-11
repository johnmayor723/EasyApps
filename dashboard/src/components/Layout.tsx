import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Layout.css";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: "▦", end: true },
  { to: "/orders", label: "Orders", icon: "📦" },
  { to: "/products", label: "Products", icon: "🗂️" },
  { to: "/customers", label: "Customers", icon: "👥" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Layout() {
  const { tenant, owner, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">{"<e/>"}</span>
          <span className="brand-name">{tenant?.slug || "EasyApps"}</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-owner">{owner?.email}</div>
          <button className="btn btn-secondary sidebar-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="topbar-plan">
            Plan: <strong>{tenant?.plan || "free"}</strong>
          </div>
          {tenant?.url && (
            <a href={tenant.url} target="_blank" rel="noreferrer" className="btn btn-secondary">
              View store
            </a>
          )}
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
