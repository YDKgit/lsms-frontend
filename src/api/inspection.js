import { apiRequest, ApiError } from './client';

const API_BASE = 'http://localhost:8080';

export function getInspections(token) {
  return apiRequest('/api/inspections', { token });
}

export function getInspection(token, inspectionId) {
  return apiRequest(`/api/inspections/${inspectionId}`, { token });
}

export async function getInspectionCalendar(token, { year, month, labId }) {
  const url = new URL(`${API_BASE}/api/inspections/calendar`);
  url.searchParams.set('year', String(year));
  url.searchParams.set('month', String(month));
  if (labId) url.searchParams.set('labId', String(labId));

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(payload?.message || `요청 실패 (${response.status})`, response.status);
  }
  return payload;
}

export function updateInspectionAction(token, detailId, status) {
  return apiRequest(`/api/inspections/action/${detailId}`, {
    method: 'PATCH',
    token,
    params: { status },
  });
}

export async function downloadInspectionExcel(token, inspectionId) {
  const response = await fetch(`${API_BASE}/api/inspections/${inspectionId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(payload?.data || payload?.message || '다운로드 실패', response.status);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `inspection_${inspectionId}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function registerInspection(token, formData) {
  const response = await fetch(`${API_BASE}/api/inspections`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    credentials: 'include',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new ApiError(payload.data || payload.message || '점검 등록 실패', response.status);
  }
  return payload.data ?? payload;
}
