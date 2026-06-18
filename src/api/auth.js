import { apiRequest } from './client';

export function login(userId, password) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: { userId, password },
  });
}
