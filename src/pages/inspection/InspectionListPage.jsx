import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InspectionSubNav from '../../components/inspection/InspectionSubNav';
import { getInspections } from '../../api/inspection';
import { useAuth } from '../../context/AuthContext';

const INSPECTION_TYPE_LABEL = {
  DAILY: '일상점검',
  REGULAR: '정기점검',
  PRECISION: '정밀안전진단',
  OCCASIONAL: '수시점검',
};

export default function InspectionListPage() {
  const { token, hasRole } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canView     = hasRole('SYSTEM_ADMIN', 'LAB_MANAGER', 'LAB_SAFETY_MANAGER', 'SAFETY_MANAGEMENT_TEAM');
  const canRegister = hasRole('SYSTEM_ADMIN', 'LAB_SAFETY_MANAGER', 'SAFETY_MANAGEMENT_TEAM');

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    getInspections(token)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, canView]);

  if (!canView) {
    return (
      <div className="page">
        <h2>점검 관리</h2>
        <InspectionSubNav />
        <section className="card">
          <p className="muted-text">점검 목록 조회 권한이 없습니다.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>점검 관리</h2>
        {canRegister && (
          <Link to="/inspections/new" className="btn btn-primary">점검 등록</Link>
        )}
      </div>
      <InspectionSubNav />
      <h3 className="inspection-section-title">점검 목록</h3>

      {error && <p className="error-text">{error}</p>}
      {loading ? <p>불러오는 중...</p> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>연구실</th>
              <th>점검자</th>
              <th>점검일</th>
              <th>점검 유형</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={5} className="empty-cell">등록된 점검이 없습니다.</td></tr>
            )}
            {items.map((item) => (
              <tr
                key={item.inspectionID}
                className="clickable-row"
                onClick={() => navigate(`/inspections/${item.inspectionID}`)}
              >
                <td>{item.inspectionID}</td>
                <td>{item.labName}</td>
                <td>{item.inspectorName}</td>
                <td>{item.inspectionDate}</td>
                <td>{INSPECTION_TYPE_LABEL[item.inspectionType] || item.inspectionType || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
