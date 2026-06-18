import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: '홈', end: true },
  { to: '/users', label: '사용자 관리', matchPrefix: '/users' },
  { to: '/labs', label: '연구실 관리' },
  { to: '/chemicals', label: '화학물질 관리', matchPrefix: '/chemicals' },
  { to: '/wastes', label: '폐기물 관리' },
  { to: '/inspections/calendar', label: '점검 관리', matchPrefix: '/inspections' },
  { to: '/educations', label: '안전교육', matchPrefix: '/educations' },
];

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">LSMS</div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => {
                const active = item.matchPrefix
                  ? location.pathname.startsWith(item.matchPrefix)
                  : isActive;
                return `nav-link${active ? ' active' : ''}`;
              }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
            로그아웃
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
