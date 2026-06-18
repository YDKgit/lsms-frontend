import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ITEMS = [
  { to: '/inspections/calendar', label: '월별 현황', end: true },
  { to: '/inspections', label: '점검 목록', end: true },
  {
    to: '/inspections/checklist',
    label: '체크리스트 관리',
    end: true,
    roles: ['SYSTEM_ADMIN', 'SAFETY_MANAGEMENT_TEAM'],
  },
];

export default function InspectionSubNav() {
  const { hasRole } = useAuth();

  return (
    <nav className="inspection-subnav">
      {ITEMS.filter((item) => !item.roles || hasRole(...item.roles)).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `inspection-subnav-link${isActive ? ' active' : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
