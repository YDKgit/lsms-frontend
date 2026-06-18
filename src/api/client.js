const API_BASE = 'http://localhost:8080';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function handleExpired() {
  localStorage.removeItem('lsms_token');
  localStorage.removeItem('lsms_user');
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

export async function apiRequest(path, { method = 'GET', body, token, params } = {}) {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (response.status === 204) {
    return null;
  }

  // 토큰 만료 또는 미인증 → 로그아웃 후 로그인 화면
  if (response.status === 401) {
    handleExpired();
    throw new ApiError('세션이 만료됐습니다. 다시 로그인해 주세요.', 401);
  }

  const contentType = response.headers.get('content-type');
  const payload = contentType?.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const message = payload?.data || payload?.message || `요청 실패 (${response.status})`;
    throw new ApiError(message, response.status);
  }

  if (payload && payload.success === false) {
    throw new ApiError(payload.data || '요청 실패', response.status);
  }

  return payload?.data ?? payload;
}
