import { apiRequest } from './client';

export function getUsers(token, { department } = {}) {
  return apiRequest('/api/users', { token, params: { department } });
}

export function getUser(token, userId) {
  return apiRequest(`/api/users/${userId}`, { token });
}

export function registerUser(token, body) {
  return apiRequest('/api/users', { method: 'POST', token, body });
}
