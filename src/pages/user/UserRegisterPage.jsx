import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/user';
import { useAuth } from '../../context/AuthContext';
import { ROLE_OPTIONS } from '../../utils/roleLabels';

export default function UserRegisterPage() {
  const { token, hasRole } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    password: '',
    name: '',
    department: '',
    phoneNumber: '010-0000-0000',
    role: 'RESEARCHER',
  });

  const canRegister = hasRole('SYSTEM_ADMIN');

  if (!canRegister) {
    return (
      <div className="page">
        <h2>사용자 등록</h2>
        <p className="error-text">이 기능을 사용할 권한이 없습니다.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const created = await registerUser(token, form);
      navigate(`/users/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>사용자 등록</h2>
      <p className="page-desc muted-text">시스템 관리자만 새 사용자를 등록할 수 있습니다.</p>
      {error && <p className="error-text">{error}</p>}
      <form className="card form-card" onSubmit={handleSubmit}>
        <label>아이디
          <input
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            required
          />
        </label>
        <label>비밀번호
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </label>
        <label>이름
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label>부서
          <input
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            required
          />
        </label>
        <label>연락처 (예: 010-1234-5678)
          <input
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            pattern="^\d{2,3}-\d{3,4}-\d{4}$"
            required
          />
        </label>
        <label>역할
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            required
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </label>
        <div className="button-row">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/users')}>
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
