import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEducations } from '../../api/education';
import { useAuth } from '../../context/AuthContext';

export default function EducationListPage() {
  const { token, hasRole } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const canRegister = hasRole('SYSTEM_ADMIN', 'EDUCATION_MANAGER');

  useEffect(() => {
    getEducations(token)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="page">
      <div className="page-header">
        <h2>안전교육 목록</h2>
        {canRegister && (
          <button type="button" className="btn btn-primary" onClick={() => navigate('/educations/new')}>
            교육 등록
          </button>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="muted-text">등록된 교육 영상이 없습니다.</p>
      ) : (
        <div className="education-grid">
          {items.map((item) => (
            <button
              key={item.contentId}
              type="button"
              className="education-card"
              onClick={() => navigate(`/educations/${item.contentId}`)}
            >
              <div className="education-card-header">
                <span className="education-category">{item.categoryName}</span>
                {item.isCompleted && <span className="education-badge">수료</span>}
              </div>
              <h3>{item.title}</h3>
              <p className="education-desc">{item.description || '설명 없음'}</p>
              <div className="education-meta">
                <span>{item.termTitle}</span>
                <span>필수 {item.requiredTime}초</span>
              </div>
              <div className="education-progress-bar">
                <div className="education-progress-fill" style={{ width: `${item.learningRate}%` }} />
              </div>
              <span className="education-progress-text">진도 {item.learningRate}%</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
