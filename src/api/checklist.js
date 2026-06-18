import { ApiError } from './client';

const API_BASE = 'http://localhost:8080';

async function checklistRequest(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(payload?.message || `요청 실패 (${response.status})`, response.status);
  }
  return payload;
}

export function getActiveChecklist(token) {
  return checklistRequest('/api/checklist', { token });
}

export function getAllChecklist(token) {
  return checklistRequest('/api/checklist/all', { token });
}

export function createChecklistItem(token, body) {
  return checklistRequest('/api/checklist', { method: 'POST', token, body });
}
