import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEducationForm, registerEducation } from '../../api/education';
import { useAuth } from '../../context/AuthContext';

export default function EducationRegisterPage() {
  const { token, hasRole } = useAuth();
  const navigate = useNavigate();
  const [options, setOptions] = useState({ categories: [], terms: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    videoUrl: '',
    description: '',
    requiredTime: 60,
    categoryId: '',
    termId: '',
  });

  const canRegister = hasRole('SYSTEM_ADMIN', 'EDUCATION_MANAGER');

  useEffect(() => {
    if (!canRegister) return;
    getEducationForm(token)
      .then(setOptions)
      .catch((err) => setError(err.message));
  }, [token, canRegister]);

  if (!canRegister) {
    return (
      <div className="page">
        <h2>안전교육 등록</h2>
        <p className="error-text">이 기능을 사용할 권한이 없습니다.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerEducation(token, {
        title: form.title,
        videoUrl: form.videoUrl,
        description: form.description,
        requiredTime: Number(form.requiredTime),
        categoryId: Number(form.categoryId),
        termId: Number(form.termId),
      });
      navigate('/educations');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>안전교육 등록</h2>
      {error && <p className="error-text">{error}</p>}
      <form className="card form-card" onSubmit={handleSubmit}>
        <label>영상 제목
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </label>
        <label>영상 URL
          <input
            type="url"
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            required
          />
        </label>
        <label>설명
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </label>
        <label>필수 시청 시간(초)
          <input
            type="number"
            min={1}
            value={form.requiredTime}
            onChange={(e) => setForm({ ...form, requiredTime: e.target.value })}
            required
          />
        </label>
        <label>카테고리
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            required
          >
            <option value="">선택</option>
            {options.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label>교육 학기
          <select
            value={form.termId}
            onChange={(e) => setForm({ ...form, termId: e.target.value })}
            required
          >
            <option value="">선택</option>
            {options.terms.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>
        <div className="button-row">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/educations')}>
            취소
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '등록 중...' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
