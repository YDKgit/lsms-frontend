import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InspectionSubNav from '../../components/inspection/InspectionSubNav';
import { createChecklistItem } from '../../api/checklist';
import { useAuth } from '../../context/AuthContext';

export default function ChecklistCreatePage() {
  const { token, hasRole } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ category: '', content: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canCreate = hasRole('SYSTEM_ADMIN', 'SAFETY_MANAGEMENT_TEAM');

  if (!canCreate) {
    return (
      <div className="page">
        <h2>체크리스트 생성</h2>
        <p className="error-text">이 기능을 사용할 권한이 없습니다.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createChecklistItem(token, form);
      navigate('/inspections/checklist');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>점검 관리</h2>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/inspections/checklist')}>취소</button>
      </div>
      <InspectionSubNav />
      <h3 className="inspection-section-title">체크리스트 문항 추가</h3>

      {error && <p className="error-text">{error}</p>}

      <form className="card form-card" onSubmit={handleSubmit}>
        <label>분야
          <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </label>
        <label>문항 내용
          <textarea required rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '저장 중...' : '생성'}
        </button>
      </form>
    </div>
  );
}
