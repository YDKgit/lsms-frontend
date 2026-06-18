import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchWastes } from '../../api/waste';
import { useAuth } from '../../context/AuthContext';

const STATUS_OPTIONS = ['', 'REGISTERED', 'STORED', 'DISPOSAL_REQUESTED', 'DISPOSED'];

export default function WasteListPage() {
  const { token, hasRole } = useAuth();
  const navigate = useNavigate();
  const [wastes, setWastes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    wasteName: '',
    wasteTypeCode: '',
    generatedLabId: '',
    storageLocation: '',
    status: '',
  });

  const canView = hasRole('SYSTEM_ADMIN', 'LAB_MANAGER', 'RESEARCHER');
  const canRegister = hasRole('SYSTEM_ADMIN', 'LAB_MANAGER', 'RESEARCHER');

  const load = () => {
    if (!canView) return;
    setLoading(true);
    setError('');
    searchWastes(token, {
      ...filters,
      generatedLabId: filters.generatedLabId ? Number(filters.generatedLabId) : undefined,
    })
      .then(setWastes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token]);

  if (!canView) {
    return (
      <div className="page">
        <h2>폐기물 목록</h2>
        <section className="card">
          <p className="muted-text">폐기물 목록 조회 권한이 없습니다.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>폐기물 목록</h2>
        {canRegister && (
          <button type="button" className="btn btn-primary" onClick={() => navigate('/wastes/new')}>
            폐기물 등록
          </button>
        )}
      </div>

      <div className="card filter-card">
        <div className="filter-grid">
          <input placeholder="폐기물명" value={filters.wasteName} onChange={(e) => setFilters({ ...filters, wasteName: e.target.value })} />
          <input placeholder="종류 코드" value={filters.wasteTypeCode} onChange={(e) => setFilters({ ...filters, wasteTypeCode: e.target.value })} />
          <input placeholder="연구실 ID" value={filters.generatedLabId} onChange={(e) => setFilters({ ...filters, generatedLabId: e.target.value })} />
          <input placeholder="보관 위치" value={filters.storageLocation} onChange={(e) => setFilters({ ...filters, storageLocation: e.target.value })} />
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            {STATUS_OPTIONS.map((s) => <option key={s || 'all'} value={s}>{s || '전체 상태'}</option>)}
          </select>
        </div>
        <button type="button" className="btn btn-primary" onClick={load}>검색</button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? <p>불러오는 중...</p> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>폐기물명</th>
              <th>종류</th>
              <th>연구실</th>
              <th>보관위치</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {wastes.map((w) => (
              <tr key={w.id} className="clickable-row" onClick={() => navigate(`/wastes/${w.id}`)}>
                <td>{w.id}</td>
                <td>{w.wasteName}</td>
                <td>{w.wasteTypeName}</td>
                <td>{w.generatedLabName}</td>
                <td>{w.storageLocation}</td>
                <td>{w.status}</td>
              </tr>
            ))}
            {wastes.length === 0 && (
              <tr><td colSpan={6} className="empty-cell">데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
