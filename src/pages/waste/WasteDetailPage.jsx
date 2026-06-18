import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteWaste, getWaste } from '../../api/waste';
import { useAuth } from '../../context/AuthContext';

export default function WasteDetailPage() {
  const { wasteId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [waste, setWaste] = useState(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getWaste(token, wasteId)
      .then(setWaste)
      .catch((err) => setError(err.message));
  }, [token, wasteId]);

  const handleDelete = async () => {
    if (!window.confirm('이 폐기물을 삭제(상태 DELETED)하시겠습니까?')) return;
    setDeleting(true);
    try {
      await deleteWaste(token, wasteId);
      navigate('/wastes');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (error) return <p className="error-text">{error}</p>;
  if (!waste) return <p>불러오는 중...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>폐기물 상세</h2>
        <div className="button-row">
          <Link to="/wastes" className="btn btn-outline">목록</Link>
          <Link to={`/wastes/${wasteId}/edit`} className="btn btn-primary">수정</Link>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>

      <section className="card">
        <dl className="detail-grid">
          <dt>폐기물명</dt><dd>{waste.wasteName}</dd>
          <dt>종류</dt><dd>{waste.wasteTypeName} ({waste.wasteTypeCode})</dd>
          <dt>발생 연구실</dt>
          <dd>
            {waste.generatedLabId ? (
              <button type="button" className="link-btn" onClick={() => navigate(`/labs/${waste.generatedLabId}`)}>
                {waste.generatedLabName} →
              </button>
            ) : (waste.generatedLabName ?? '-')}
          </dd>
          <dt>보관 위치</dt><dd>{waste.storageLocation}</dd>
          <dt>등록자</dt><dd>{waste.registeredByName}</dd>
          <dt>등록일</dt><dd>{waste.registeredAt}</dd>
          <dt>상태</dt><dd>{waste.status}</dd>
        </dl>
      </section>
    </div>
  );
}
