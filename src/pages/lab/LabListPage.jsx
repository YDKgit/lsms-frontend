import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLabs } from '../../api/lab';
import { useAuth } from '../../context/AuthContext';

export default function LabListPage() {
  const { token, hasRole } = useAuth();
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const canRegister = hasRole('SYSTEM_ADMIN', 'LAB_MANAGER');

  useEffect(() => {
    getLabs(token)
      .then(setLabs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(
    () => labs.filter((lab) => lab.labName?.toLowerCase().includes(keyword.toLowerCase())),
    [labs, keyword],
  );

  return (
    <div className="page">
      <div className="page-header">
        <h2>연구실 목록</h2>
        {canRegister && (
          <button type="button" className="btn btn-primary" onClick={() => navigate('/labs/new')}>
            연구실 등록
          </button>
        )}
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="연구실명 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>연구실명</th>
              <th>위치</th>
              <th>유형</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lab) => (
              <tr key={lab.labId} className="clickable-row" onClick={() => navigate(`/labs/${lab.labId}`)}>
                <td>{lab.labId}</td>
                <td>{lab.labName}</td>
                <td>{lab.buildingLocation}</td>
                <td>{lab.labType}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-cell">데이터가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
