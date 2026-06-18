import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers } from '../../api/user';
import { useAuth } from '../../context/AuthContext';
import { getRoleLabel } from '../../utils/roleLabels';

export default function UserListPage() {
  const { token, user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const canList = hasRole('SYSTEM_ADMIN');
  const canRegister = hasRole('SYSTEM_ADMIN');

  useEffect(() => {
    if (!canList) {
      setLoading(false);
      return;
    }
    getUsers(token)
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, canList]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return users;
    return users.filter((u) =>
      u.name?.toLowerCase().includes(kw) ||
      u.userId?.toLowerCase().includes(kw) ||
      u.department?.toLowerCase().includes(kw)
    );
  }, [users, keyword]);

  if (!canList) {
    return (
      <div className="page">
        <h2>사용자 관리</h2>
        <section className="card">
          <p className="muted-text">사용자 목록 조회 권한이 없습니다.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/users/${user.id}`)}
          >
            내 정보 보기
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>사용자 목록</h2>
        {canRegister ? (
          <button type="button" className="btn btn-primary" onClick={() => navigate('/users/new')}>
            사용자 등록
          </button>
        ) : (
          <span className="muted-text">등록 권한이 없습니다.</span>
        )}
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="이름 / 아이디 / 부서 검색"
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
              <th>아이디</th>
              <th>이름</th>
              <th>부서</th>
              <th>역할</th>
              <th>연락처</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="clickable-row"
                onClick={() => navigate(`/users/${u.id}`)}
              >
                <td>{u.id}</td>
                <td>{u.userId}</td>
                <td>{u.name}</td>
                <td>{u.department}</td>
                <td>{getRoleLabel(u.role)}</td>
                <td>{u.phoneNumber}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-cell">데이터가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
