import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getUser } from '../../api/user';
import { useAuth } from '../../context/AuthContext';
import { getRoleLabel } from '../../utils/roleLabels';

function formatDateTime(value) {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 16);
}

export default function UserDetailPage() {
  const { userId } = useParams();
  const { token, user, hasRole } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  const canView = hasRole('SYSTEM_ADMIN') || String(user?.id) === String(userId);

  useEffect(() => {
    if (!canView) return;
    getUser(token, userId)
      .then(setProfile)
      .catch((err) => setError(err.message));
  }, [token, userId, canView]);

  if (!canView) {
    return (
      <div className="page">
        <h2>사용자 상세</h2>
        <p className="error-text">이 사용자 정보를 조회할 권한이 없습니다.</p>
      </div>
    );
  }

  if (error && !profile) return <p className="error-text">{error}</p>;
  if (!profile) return <p>불러오는 중...</p>;

  const isSelf = String(user?.id) === String(profile.id);

  return (
    <div className="page">
      <div className="page-header">
        <h2>{isSelf ? '내 정보' : '사용자 상세'}</h2>
        {hasRole('SYSTEM_ADMIN') && (
          <Link to="/users" className="btn btn-outline">목록</Link>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      <section className="card">
        <h3>기본 정보</h3>
        <dl className="detail-grid">
          <dt>사용자 ID</dt><dd>{profile.id}</dd>
          <dt>아이디</dt><dd>{profile.userId}</dd>
          <dt>이름</dt><dd>{profile.name}</dd>
          <dt>부서</dt><dd>{profile.department}</dd>
          <dt>연락처</dt><dd>{profile.phoneNumber}</dd>
          <dt>역할</dt><dd>{getRoleLabel(profile.role)}</dd>
          <dt>가입일</dt><dd>{formatDateTime(profile.createdAt)}</dd>
        </dl>
      </section>
    </div>
  );
}
