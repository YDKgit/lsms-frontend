import { apiRequest } from './client';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export function getLabs(token) {
  return apiRequest('/api/labs', { token });
}

export function getLab(token, labId) {
  return apiRequest(`/api/labs/${labId}`, { token });
}

export function getLabForm(token) {
  return apiRequest('/api/labs/form', { token });
}

export function registerLab(token, body) {
  return apiRequest('/api/labs/register', { method: 'POST', token, body });
}

async function uploadMultipart(token, path, formData, errorMessage) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || errorMessage);
  }
  return data.data ?? data;
}

export function uploadFloorPlan(token, labId, { file, buildingName, floorLevel }) {
  const formData = new FormData();
  if (buildingName) formData.append('buildingName', buildingName);
  if (floorLevel != null && floorLevel !== '') formData.append('floorLevel', String(floorLevel));
  formData.append('file', file);
  return uploadMultipart(token, `/api/labs/${labId}/floor-plan`, formData, '건물 평면도 업로드에 실패했습니다.');
}

export function uploadLayoutPlan(token, labId, file) {
  const formData = new FormData();
  formData.append('file', file);
  return uploadMultipart(token, `/api/labs/${labId}/layout/plan`, formData, '연구실 배치도 업로드에 실패했습니다.');
}

export function saveLayout(token, labId, { filePath, layoutData }) {
  return apiRequest(`/api/labs/${labId}/layout`, {
    method: 'PUT',
    token,
    body: { filePath: filePath || '', layoutData },
  });
}
