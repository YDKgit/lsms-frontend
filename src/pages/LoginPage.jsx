import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('admin');
  const [password, setPassword] = useState('1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginApi(userId, password);
      login(data);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>LSMS</h1>
        <p className="subtitle">연구실 안전 관리 시스템</p>
        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <span className="login-field-label">아이디</span>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>
          <div className="login-field">
            <span className="login-field-label">비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
