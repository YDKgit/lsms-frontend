import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InspectionSubNav from '../../components/inspection/InspectionSubNav';
import { getAllChecklist } from '../../api/checklist';
import { useAuth } from '../../context/AuthContext';

export default function ChecklistPage() {
  const { token, hasRole } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const canCreate = hasRole('SYSTEM_ADMIN', 'SAFETY_MANAGEMENT_TEAM');

  useEffect(() => {
    getAllChecklist(token)
      .then(setItems)
      .catch((err) => setError(err.message));
  }, [token]);

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="page-header">
        <h2>점검 관리</h2>
        {canCreate && (
          <Link to="/inspections/checklist/new" className="btn btn-primary">문항 추가</Link>
        )}
      </div>
      <InspectionSubNav />
      <h3 className="inspection-section-title">체크리스트 관리</h3>
      <p className="muted-text section-desc">일상점검 등록 시 사용하는 점검 문항을 관리합니다.</p>

      {error && <p className="error-text">{error}</p>}

      {Object.keys(grouped).length === 0 ? (
        <p className="muted-text">등록된 체크리스트가 없습니다.</p>
      ) : (
        Object.entries(grouped).map(([category, list]) => (
          <section key={category} className="card">
            <h3>{category}</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>문항</th>
                  <th>사용 여부</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <tr key={item.id}>
                    <td>{item.content}</td>
                    <td>{(item.isUse ?? item.use) ? '사용' : '비활성'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))
      )}
    </div>
  );
}
