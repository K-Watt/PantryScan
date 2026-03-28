import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/',         icon: '🏠', label: 'Pantry',   end: true },
  { to: '/recipes',  icon: '📖', label: 'Recipes',  end: false },
  { to: '/planner',  icon: '📅', label: 'Planner',  end: false },
  { to: '/shopping', icon: '🛒', label: 'Shopping', end: false },
  { to: '/scan',     icon: '📱', label: 'Scanner',  end: false },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);

  const isMobile = () => window.innerWidth < 768;

  function collapse() {
    setCollapsed(true);
    setOverlayVisible(false);
  }

  function expand() {
    setCollapsed(false);
    if (isMobile()) setOverlayVisible(true);
  }

  function toggle() {
    if (collapsed) expand();
    else collapse();
  }

  useEffect(() => {
    if (isMobile()) collapse();
    function onResize() {
      if (!isMobile()) setOverlayVisible(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      {/* Hamburger toggle */}
      <button
        className="sidebar-toggle"
        aria-label="Toggle navigation"
        onClick={toggle}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay (mobile) */}
      {overlayVisible && (
        <div className="sidebar-overlay active" onClick={collapse} />
      )}

      {/* Sidebar */}
      <aside
        className={`app-sidebar${collapsed ? ' collapsed' : ''}`}
        id="appSidebar"
      >
        <div className="sidebar-brand">
          <NavLink to="/">PantryScan</NavLink>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
            >
              <span className="sidebar-link-icon">{icon}</span>
              <span className="sidebar-link-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <span className="sidebar-link-icon">👤</span>
            <span className="sidebar-link-label">Sign In</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
